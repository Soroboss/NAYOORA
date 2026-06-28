import { generateMemberCardFiles } from './lib/cardGenerator';

(async () => {
  try {
    const member = {
      id: 'test-id',
      organization_id: 'test-org',
      first_name: 'John',
      last_name: 'Doe',
      member_number: '123',
      status: 'active',
      organization: {
        name: 'Test Org',
        logo_url: 'https://placehold.co/80x80.png'
      },
      photo_url: 'https://placehold.co/250x250.png',
      qr_token: '123'
    };
    const settings = {
      primary_color: '#000',
      secondary_color: '#000',
      text_color: '#000',
      corner_style: 'rounded',
      show_qr: true,
      show_photo: true,
      legal_mentions: 'Test'
    };
    await generateMemberCardFiles(member, settings, new Date());
    console.log("Success!");
  } catch (e: any) {
    console.error("Failed:", e.message);
  }
})();
