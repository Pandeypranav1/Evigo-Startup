import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRoute, fakeDatabase } from './helpers/route-loader.mjs';
import * as workflow from '../src/lib/booking-workflow.ts';
const request = (path, method = 'GET', body) => new Request(`http://local${path}`, { method, ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) });
function route(path, user, tables = {}, extras = {}) {
  const db = fakeDatabase(tables);
  const mod = loadRoute(new URL(`../src/app/api/${path}/route.ts`, import.meta.url), {
    '@/lib/server': { getAuthenticatedUser: async () => ({ user }) },
    '@/lib/supabase': { createAdminClient: () => db },
    '@/lib/booking-workflow': workflow,
    '@/lib/email': {}, '@/lib/notifications': {},
    '@supabase/supabase-js': { createClient: () => db }, ...extras,
  });
  return { ...mod, db };
}
test('profile read/update rejects anonymous and cross-account requests', async () => {
  for (const user of [null, { id: 'owner' }]) {
    const h = route('profile', user);
    assert.equal((await h.GET(request('/api/profile?user_id=victim'))).status, user ? 403 : 401);
    assert.equal((await h.PATCH(request('/api/profile', 'PATCH', { user_id: 'victim', full_name: 'Changed' }))).status, user ? 403 : 401);
    assert.equal(h.db.calls.length, 0);
  }
});
test('profile permits only own row; protected role is not updated', async () => {
  const h = route('profile', { id: 'owner' }, { profiles: { id: 'owner', role: 'client' } });
  assert.equal((await h.GET(request('/api/profile'))).status, 200);
  assert.equal((await h.PATCH(request('/api/profile','PATCH',{ user_id: 'owner', full_name: 'Name', role: 'admin' }))).status, 200);
  assert.ok(h.db.calls.filter((c) => c.operation === 'update').every((c) => !('role' in c.updates)));
});
test('avatar deletion and service availability cannot trust supplied identity', async () => {
  const avatar = route('profile/avatar', { id: 'owner' });
  assert.equal((await avatar.DELETE(request('/api/profile/avatar?user_id=victim','DELETE'))).status, 403);
  const anon = route('services/availability', null);
  assert.equal((await anon.PATCH(request('/api/services/availability','PATCH',{ service_id: 's', is_available: true }))).status, 401);
  const other = route('services/availability', { id: 'other' }, { services: { id: 's', provider_id: 'faab-owner' }, providers: [] });
  assert.equal((await other.PATCH(request('/api/services/availability','PATCH',{ service_id: 's', is_available: true, user_id: 'victim' }))).status, 403);
});
test('booking rejects reset to pending and unrelated provider acceptance', async () => {
  const h = route('bookings', { id: 'other' }, { bookings: { id:'b', provider_uuid: 'assigned', status: 'pending' }, providers: [{ id:'unrelated' }] });
  assert.equal((await h.PATCH(request('/api/bookings','PATCH',{ id:'b', status:'pending' }))).status, 400);
  assert.equal((await h.PATCH(request('/api/bookings','PATCH',{ id:'b', status:'confirmed' }))).status, 403);
  assert.equal(h.db.calls.filter((c) => c.operation === 'update').length, 0);
});
test('booking uses compare-and-set and reports concurrent update', async () => {
  const h = route('bookings', { id:'owner' }, { bookings: ({ operation }) => operation === 'update' ? null : { id:'b', provider_uuid:'assigned', status:'pending' }, providers:[{ id:'assigned' }] });
  assert.equal((await h.PATCH(request('/api/bookings','PATCH',{ id:'b', status:'confirmed' }))).status, 409);
  assert.ok(h.db.calls.find((c) => c.operation === 'update').filters.some(([key,value]) => key === 'status' && value === 'pending'));
});
test('booking dates, ownership and status boundaries', () => {
  assert.equal(workflow.providerOwnsBooking(['unrelated'], { provider_uuid:'assigned' }), false);
  for (const date of ['2026-02-30', 'invalid', '2025-01-01']) assert.equal(workflow.validBookingDate(date,'2026-01-01'),false);
  assert.equal(workflow.validBookingDate('2026-12-01','2026-01-01'),true);
  assert.equal(workflow.validBookingTransition('completed','cancelled','client'),false);
  assert.equal(workflow.validBookingTransition('pending','completed','provider'),false);
  assert.equal(workflow.validBookingTransition('pending','confirmed','provider'),true);
  assert.equal(workflow.isEligibleProvider({ registration_status:'pending',is_verified:true,is_bookable:true }),false);
});
test('admin guard ignores forged headers and unverified allowlisted email', async () => {
  for (const user of [null, { id:'attacker', email:'admin@example.test', app_metadata:{} }]) {
    const h = loadRoute(new URL('../src/lib/account-security.ts',import.meta.url), {
      '@/lib/server': { getAuthenticatedUser: async () => ({ user }) },
    }, { ADMIN_PROVIDER_EMAILS:'admin@example.test' });
    assert.equal((await h.authorizeAccountAdmin()).response.status,user ? 403 : 401);
  }
  const h = loadRoute(new URL('../src/lib/account-security.ts',import.meta.url), {
    '@/lib/server': { getAuthenticatedUser: async () => ({ user: { id:'admin', app_metadata:{ role:'admin' } } }) },
  });
  assert.equal((await h.authorizeAccountAdmin()).user.id,'admin');
});
test('disabled Google integration reports unavailable without exposing a key', async () => {
  // Exercise source route through a mocked provider transport, with a synthetic key.
  const h = loadRoute(new URL('../src/app/api/nearby-hotels/route.ts',import.meta.url), {}, { GOOGLE_MAPS_API_KEY:'synthetic-secret' });
  const response = await h.GET(request('/api/nearby-hotels?lat=25&lng=85'));
  assert.equal(response.status,503);
  assert.equal((await response.text()).includes('synthetic-secret'),false);
});

test('OTP login preserves the saved account role despite a different login tab', async () => {
  const db = fakeDatabase({ profiles: { role:'provider',avatar_url:null } });
  const h = loadRoute(new URL('../src/app/api/auth/verify-otp/route.ts',import.meta.url), {
    '@/lib/supabase': { createAdminClient: () => db },
    '@supabase/supabase-js': { createClient: () => ({ auth: { verifyOtp: async () => ({ data: { user: { id:'owner',email:'owner@example.test' }, session:{ access_token:'synthetic',refresh_token:'synthetic' } },error:null }) } }) },
  });
  const response = await h.POST(request('/api/auth/verify-otp','POST',{ email:'owner@example.test',otp:'123456',role:'client' }));
  assert.equal(response.status,200);
  assert.equal((await response.json()).user.role,'provider');
  assert.equal(db.calls.find((c) => c.operation==='upsert').updates.options.ignoreDuplicates,true);
});
test('combo provider history never adds another provider or the FaabCab ID', async () => {
  const h = route('combo-packs/bookings',{id:'owner'},{providers:[]},{'@/lib/combo':{}});
  const response = await h.GET(request('/api/combo-packs/bookings?role=provider'));
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).items,[]);
  assert.equal(h.db.calls.some((c)=>c.table==='combo_booking_items'),false);
});
test('new bookings cannot be created by an anonymous caller', async () => {
  const h=route('bookings',null);
  assert.equal((await h.POST(request('/api/bookings','POST',{ customer_name:'Example' }))).status,401);
  assert.equal(h.db.calls.length,0);
});

const bookingInput = { provider_uuid:'20000000-0000-0000-0000-000000000001', provider_id:'20000000-0000-0000-0000-000000000001',
  service_type:'Event',event_date:'2099-12-01',customer_name:'Synthetic customer',customer_phone:'9000000001' };
test('booking saves a pending request and emails the persisted contact values', async () => {
  let emailed;
  const h=route('bookings',{id:'owner',email:'owner@example.test'}, {
    providers:{id:bookingInput.provider_uuid,user_id:'provider-owner',business_name:'Stored business',registration_status:'approved',is_verified:true,is_bookable:true},
    profiles:{email:'provider@example.test'},
    bookings:({operation,updates})=>operation==='insert'?{id:'saved-booking',...updates}:null,
  }, {'@/lib/email':{sendNewBookingEmailToProvider:async (payload)=>{emailed=payload;}}});
  const response=await h.POST(request('/api/bookings','POST',{...bookingInput,provider_id:'faab-cab',status:'confirmed',customer_email:'other@example.test',provider_name:'Client supplied name'}));
  assert.equal(response.status,201);
  const {booking}=await response.json();
  assert.equal(booking.status,'pending');
  assert.equal(booking.provider_id,bookingInput.provider_uuid);
  assert.equal(booking.customer_email,'owner@example.test');
  assert.equal(booking.provider_name,'Stored business');
  assert.equal(emailed.customerEmail,booking.customer_email);
  assert.equal(emailed.providerName,booking.provider_name);
});
test('transport date/count overrides and invalid service IDs cannot bypass validation', async () => {
  for (const overrides of [
    {service_type:'Transport',pickup_location:'Origin',drop_location:'Destination',travel_date:'2000-01-01'},
    {service_type:'Transport',pickup_location:'Origin',drop_location:'Destination',passenger_count:0,guest_count:2},
    {service_id:'missing-service'}, {customer_phone:'----------'},
  ]) {
    const h=route('bookings',{id:'owner'});
    assert.equal((await h.POST(request('/api/bookings','POST',{...bookingInput,...overrides}))).status,400);
    assert.equal(h.db.calls.length,0);
  }
});
test('repeated request returns persisted booking without inserting or notifying again', async () => {
  const h=route('bookings',{id:'owner'}, {
    providers:{id:bookingInput.provider_uuid,business_name:'Stored business',registration_status:'approved',is_verified:true,is_bookable:true},
    bookings:{id:'existing',status:'pending',...bookingInput,customer_email:null,guest_count:null,city:'Jamui, Bihar',message:null},
  });
  const response=await h.POST(request('/api/bookings','POST',bookingInput));
  assert.equal(response.status,200);
  assert.equal((await response.json()).booking.id,'existing');
  assert.equal(h.db.calls.some(c=>c.operation==='insert'),false);
});

test('profile accepts registration-length descriptions and rejects longer input', async () => {
  const h=route('profile',{id:'owner'}, {profiles:{id:'owner',role:'provider'},providers:{id:'assigned'}});
  assert.equal((await h.PATCH(request('/api/profile','PATCH',{user_id:'owner',description:'x'.repeat(5000)}))).status,200);
  assert.equal((await h.PATCH(request('/api/profile','PATCH',{user_id:'owner',description:'x'.repeat(5001)}))).status,400);
});

test('legacy FaabCab ownership permits only its actual provider and never overrides another UUID', async () => {
  const canonical='6105241d-1d38-4274-b912-eea67f4c32b0';
  for (const [owned,assigned,expected] of [[canonical,null,200],['other',null,403],[canonical,'another-provider',403]]) {
    const h=route('bookings',{id:'owner'},{bookings:{id:'legacy',provider_uuid:assigned,provider_id:'faab-cab',status:'pending'},providers:[{id:owned}]});
    assert.equal((await h.PATCH(request('/api/bookings','PATCH',{id:'legacy',status:'confirmed'}))).status,expected);
  }
});
test('failed admin component insertion cleans up only the newly created inactive pack', async () => {
  const h=route('admin/combo-packs',{id:'admin'},{combo_packs:{id:'new-draft'},combo_pack_items:{__error:{message:'synthetic insert failure'}}}, {
    '@/lib/account-security':{authorizeAccountAdmin:async()=>({user:{id:'admin'}})},
    '@/lib/combo-eligibility':{}, '@/lib/combo':{calculateComboPrice:(basePrice,discount)=>({basePrice,discount,finalPrice:basePrice-discount})},
  });
  const response=await h.POST(request('/api/admin/combo-packs','POST',{name:'Synthetic',category:'Trip Combo',base_price:100,items:[{service_type:'Transport'}]}));
  assert.equal(response.status,500);
  const cleanup=h.db.calls.find(c=>c.operation==='delete');
  assert.equal(cleanup.table,'combo_packs');
  assert.ok(cleanup.filters.some(([key,value])=>key==='id' && value==='new-draft'));
  assert.ok(cleanup.filters.some(([key,value])=>key==='is_active' && value===false));
});
test('profile refresh preserves matching sessions on transient failure but clears 401 or changed identity', async () => {
  const state=[]; const effects=[]; let index=0; let authChanged; let status=200;
  const h=loadRoute(new URL('../src/context/AuthContext.tsx',import.meta.url), {
    react:{createContext:()=>({Provider:'provider'}),useContext:()=>null,useCallback:fn=>fn,useMemo:fn=>fn(),useEffect:fn=>effects.push(fn),
      useState:initial=>{const slot=index++;state[slot]=initial;return [state[slot],value=>{state[slot]=typeof value==='function'?value(state[slot]):value;}];}},
    'react/jsx-runtime':{jsx:(_component,props)=>props},
    '@/lib/client':{createClient:()=>({auth:{onAuthStateChange:cb=>{authChanged=cb;return {data:{subscription:{unsubscribe(){}}}};}}})},
  },{NEXT_PUBLIC_SUPABASE_URL:'http://local',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic'}, {
    localStorage:{setItem(){},removeItem(){}},
    fetch:async()=>{if(status==='network') throw new Error('offline');return Response.json(status===200?{profile:{email:'owner@example.test',role:'client'}}:{error:'unavailable'},{status});},
  });
  h.AuthProvider({children:null});effects.forEach(fn=>fn());
  const emit=async(id,event='TOKEN_REFRESHED')=>{authChanged(event,id?{user:{id}}:null);await new Promise(setImmediate);};
  await emit('owner','INITIAL_SESSION');assert.equal(state[0].id,'owner');
  for(const failure of [500,503,'network']){status=failure;await emit('owner');assert.equal(state[0].id,'owner');}
  status=401;await emit('owner');assert.equal(state[0],null);
  status=200;await emit('owner');assert.equal(state[0].id,'owner');
  status=500;await emit('different');assert.equal(state[0],null);
  await emit(null,'SIGNED_OUT');assert.equal(state[0],null);
});

test('combo request reports a changed-details duplicate as a conflict', async () => {
  const db=fakeDatabase({combo_packs:{id:'pack'}});
  const h=loadRoute(new URL('../src/app/api/combo-packs/book/route.ts',import.meta.url), {
    '@/lib/server':{getAuthenticatedUser:async()=>({user:{id:'owner',email:'owner@example.test'}})},
    '@/lib/supabase':{createAdminClient:()=>({...db,rpc:async()=>({data:null,error:{code:'23505'}})})},
    '@/lib/booking-workflow':workflow,
  });
  const res=await h.POST(request('/api/combo-packs/book','POST',{combo_pack_id:'pack',start_date:'2099-12-01',customer_name:'Synthetic',customer_phone:'9000000001'}));
  assert.equal(res.status,409);
  assert.equal((await res.json()).success,false);
});

test('ordinary booking retries reject changed contact and request details without inserting', async () => {
  const saved={id:'existing',status:'pending',...bookingInput,customer_email:null,guest_count:null,city:'Jamui, Bihar',message:null};
  for(const changes of [{customer_phone:'9000000002'},{customer_name:'Changed'},{guest_count:2},{city:'Patna'},{message:'Updated'}]) {
    const h=route('bookings',{id:'owner'},{
      providers:{id:bookingInput.provider_uuid,business_name:'Stored business',registration_status:'approved',is_verified:true,is_bookable:true},bookings:saved,
    });
    const response=await h.POST(request('/api/bookings','POST',{...bookingInput,...changes}));
    assert.equal(response.status,409);
    assert.equal((await response.json()).success,false);
    assert.equal(h.db.calls.some(c=>c.operation==='insert'),false);
  }
});
test('ordinary booking unique-key collision also rejects a concurrent request with different details', async () => {
  let reads=0;
  const h=route('bookings',{id:'owner'},{
    providers:{id:bookingInput.provider_uuid,business_name:'Stored business',registration_status:'approved',is_verified:true,is_bookable:true},
    bookings:({operation})=>operation==='insert'?{__error:{code:'23505'}}:(++reads===1?null:{id:'existing',...bookingInput,customer_email:null,guest_count:null,city:'Jamui, Bihar',message:null}),
  });
  assert.equal((await h.POST(request('/api/bookings','POST',{...bookingInput,message:'Changed'}))).status,409);
  assert.equal(reads,2);
});

test('FaabCab history restricts legacy aliases to rows with no assigned UUID', async () => {
  const canonical='6105241d-1d38-4274-b912-eea67f4c32b0';
  const h=route('bookings',{id:'owner'},{providers:[{id:canonical}],bookings:[]});
  assert.equal((await h.GET(request('/api/bookings?provider_id=faab-cab'))).status,200);
  const read=h.db.calls.find(c=>c.table==='bookings');
  assert.equal(read.filters.find(([key])=>key==='or')[1],`and(provider_id.eq.faab-cab,provider_uuid.is.null),provider_uuid.in.(${canonical})`);
  const other=route('bookings',{id:'other'},{providers:[{id:bookingInput.provider_uuid}]});
  assert.equal((await other.GET(request('/api/bookings?provider_id=faab-cab'))).status,403);
  assert.equal(other.db.calls.some(c=>c.table==='bookings'),false);
});

test('location normalization keeps Bihar context when an address contains the word in', () => {
  const h=loadRoute(new URL('../src/lib/transportLocation.ts',import.meta.url), {'./constants':{BIHAR_CITIES:[]}});
  assert.equal(h.normalizeLocationText('Hotel in Gaya'),'Hotel in Gaya, Bihar, India');
  assert.equal(h.normalizeLocationText('Hotel in Gaya, Bihar'),'Hotel in Gaya, Bihar, India');
  assert.equal(h.normalizeLocationText('Hotel in Gaya, Bihar, India'),'Hotel in Gaya, Bihar, India');
  assert.equal(h.normalizeLocationText('Patna Jn'),'Patna Junction, Patna, Bihar, India');
});

test('unavailable providers retain owned history and completion but cannot accept new work', async () => {
  const tables={providers:({filters})=>filters.some(([key])=>key==='is_bookable')?[]:[{id:'assigned'}],bookings:{id:'b',provider_uuid:'assigned',status:'confirmed'}};
  const h=route('bookings',{id:'owner'},tables);
  assert.equal((await h.GET(request('/api/bookings?role=provider'))).status,200);
  assert.ok(h.db.calls.find(c=>c.table==='bookings').filters.some(([key,ids])=>key==='provider_uuid' && ids.includes('assigned')));
  assert.equal((await h.PATCH(request('/api/bookings','PATCH',{id:'b',status:'completed'}))).status,200);
  const pending=route('bookings',{id:'owner'},{...tables,bookings:{id:'b',provider_uuid:'assigned',status:'pending'}});
  assert.equal((await pending.PATCH(request('/api/bookings','PATCH',{id:'b',status:'confirmed'}))).status,403);
});
test('admin package price errors identify price validation', async () => {
  const h=route('admin/combo-packs',{id:'admin'},{},{'@/lib/account-security':{authorizeAccountAdmin:async()=>({user:{id:'admin'}})},'@/lib/combo-eligibility':{},'@/lib/combo':{}});
  const response=await h.POST(request('/api/admin/combo-packs','POST',{name:'Package',category:'Trip Combo',base_price:10,discount:11}));
  assert.equal(response.status,400);
  assert.match((await response.json()).error,/discount/);
  assert.equal(h.db.calls.length,0);
});

test('combo availability distinguishes unavailable components from date confirmation', async () => {
  for (const available of [true,false]) {
    const h=route('combo-packs/availability',null,{combo_packs:{id:'pack',is_active:true,items:[]}},{'@/lib/combo':{},'@/lib/combo-eligibility':{comboComponentsAvailable:async()=>available}});
    const response=await h.POST(request('/api/combo-packs/availability','POST',{combo_pack_id:'pack'}));
    assert.equal(response.status,200);
    const data=await response.json();
    assert.equal(data.isAvailable,available);
    assert.match(data.reason,available?/confirmed by each provider/:/currently unavailable/);
  }
});
test('combo form blocks submission when availability fails or components are unavailable', async () => {
  for (const outcome of ['unavailable','error','offline','available']) {
    const state=[];const effects=[];let index=0;
    const jsx=(type,props)=>({type,props});
    const h=loadRoute(new URL('../src/components/ComboBookingModal.tsx',import.meta.url), {
      react:{useState:initial=>{const slot=index++;if(!(slot in state))state[slot]=typeof initial==='function'?initial():initial;return[state[slot],value=>{state[slot]=typeof value==='function'?value(state[slot]):value;}];},useEffect:fn=>effects.push(fn)},
      'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'next/image':{},'next/link':{},
      '@/lib/combo':{COMBO_CATEGORY_METADATA:{}},'@/context/AuthContext':{useAuth:()=>({user:{id:'owner',email:'owner@example.test'}})},
    },{}, {fetch:async()=>{if(outcome==='offline')throw new Error('offline');return Response.json(outcome==='error'?{error:'Unavailable'}:{success:true,isAvailable:outcome==='available',reason:'Result'},{status:outcome==='error'?503:200});}});
    const render=()=>{index=0;return h.ComboBookingModal({pack:{id:'pack',category:'Trip Combo',items:[],final_price:100,base_price:100,discount:0},onClose(){}});};
    const nodes=(node)=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(nodes):[node,...nodes(node.props?.children)];
    let tree=render();
    const email=nodes(tree).find(n=>n.type==='input'&&n.props.type==='email');
    assert.equal(email.props.readOnly,true);
    assert.equal(email.props.value,'owner@example.test');
    assert.equal(nodes(tree).find(n=>n.type==='button'&&n.props.type==='submit').props.disabled,true);
    effects[0]();await new Promise(setImmediate);
    tree=render();
    assert.equal(nodes(tree).find(n=>n.type==='button'&&n.props.type==='submit').props.disabled,outcome!=='available');
  }
});
