require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
fetch(url + '/rest/v1/member_profiles?select=photo_url&photo_url=not.is.null&order=created_at.desc&limit=1', {
  headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
}).then(r => r.json()).then(async data => {
  if (!data.length) return console.log('no data');
  const photo_url = data[0].photo_url;
  console.log('photo_url', photo_url);
  
  let finalUrl = photo_url;
  if (finalUrl.startsWith('organizations/')) finalUrl = url + '/storage/v1/object/public/member-photos/' + finalUrl;
  console.log('finalUrl', finalUrl);
  
  const res = await fetch(finalUrl);
  console.log('status', res.status);
  console.log('content-type', res.headers.get('content-type'));
})
