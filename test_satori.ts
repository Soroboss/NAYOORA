import { ImageResponse } from '@vercel/og';

(async () => {
  try {
    const cardWidth = 1016;
    const cardHeight = 638;
    const settings = { primary_color: '#000', secondary_color: '#000', text_color: '#000', corner_style: 'rounded', show_qr: true, show_photo: true };
    const member = { full_name: 'John Doe', organization: { name: 'Test Org' } };

    const Recto = {
      type: 'div',
      props: {
        style: { display: 'flex' },
        children: "Hello"
      }
    };

    const res = new ImageResponse(Recto as any, { width: cardWidth, height: cardHeight });
    await res.arrayBuffer();
    console.log("ImageResponse works!");
  } catch (e: any) {
    console.error("Error:", e.message);
  }
})();
