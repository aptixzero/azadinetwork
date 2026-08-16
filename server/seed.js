'use strict';
const util = require('./util.js');

function svg(name, hue, icon) {
  return 'u/' + name + '.svg';
}

function seed() {
  var t = util.now();
  return {
    admin: {
      username: 'prf',
      pass: util.hashPassword('prf!123')
    },
    settings: {
      siteName: 'آزادی نتورک',
      siteNameEn: 'Azadi Network',
      tagline: 'خدمات و تجهیزات شبکه',
      logoText: 'AZADI',
      logoImage: '',
      theme: 'dark',
      fontScale: 100,
      header: {
        links: [
          { id: 'h1', label: 'خانه', url: '/' },
          { id: 'h2', label: 'فروشگاه', url: '/shop' },
          { id: 'h3', label: 'نمونه کارها', url: '/portfolio' },
          { id: 'h4', label: 'مقالات و آموزش', url: '/articles' },
          { id: 'h5', label: 'ارتباط با ما', url: '/contact' }
        ]
      },
      hero: {
        enabled: true,
        title: 'Azadi Network',
        welcome: 'به سایت آزادی نتورک خوش آمدید',
        description: 'اینجا خدمات و تجهیزات شبکه ارائه می‌شود',
        sub: 'طراحی، اجرا و پشتیبانی زیرساخت‌های شبکه با بالاترین کیفیت',
        ctaLabel: 'مشاهده خدمات',
        ctaUrl: '#services',
        cta2Label: 'ارتباط با ما',
        cta2Url: '/contact'
      },
      banner: {
        enabled: true,
        text: 'مشاوره رایگان برای پروژه‌های شبکه و دوربین مداربسته',
        buttonLabel: 'تماشای نمونه کارهای بیشتر',
        buttonUrl: '/portfolio'
      },
      sectionsMeta: {
        stories: { enabled: true, title: 'استوری‌ها', subtitle: 'تازه‌ترین‌های آزادی نتورک' },
        services: { enabled: true, title: 'خدماتی که ارائه می‌دهیم', subtitle: 'راهکارهای کامل زیرساخت شبکه' },
        products: { enabled: true, title: 'محصولات پرفروش', subtitle: 'برای مطلع شدن از قیمت در بله یا واتساپ پیام بدهید' },
        provinces: { enabled: true, title: 'استان‌هایی که خدمات می‌دهیم', subtitle: 'پوشش خدمات در سراسر کشور' },
        articles: { enabled: true, title: 'مقالات و آموزش', subtitle: 'دانش شبکه را با ما بیاموزید' },
        portfolioHome: { enabled: true, title: 'نمونه کارهای منتخب', subtitle: 'کیفیت اجرا را ببینید' },
        stats: { enabled: true, title: 'آزادی نتورک در یک نگاه', subtitle: '' },
        faq: { enabled: true, title: 'سوالات متداول', subtitle: 'پاسخ پرسش‌های رایج شما' }
      },
      sectionOrder: ['hero', 'stories', 'banner', 'services', 'products', 'portfolioHome', 'provinces', 'stats', 'articles', 'faq'],
      stats: [
        { id: 's1', label: 'پروژه موفق', value: '250+' },
        { id: 's2', label: 'سال تجربه', value: '10+' },
        { id: 's3', label: 'مشتری فعال', value: '400+' },
        { id: 's4', label: 'پشتیبانی', value: '24/7' }
      ],
      faq: [
        { id: 'f1', q: 'هزینه نصب دوربین مداربسته چقدر است؟', a: 'هزینه بسته به تعداد دوربین، نوع تجهیزات و متراژ کابل‌کشی متفاوت است. برای استعلام دقیق قیمت در بله یا واتساپ پیام بدهید.' },
        { id: 'f2', q: 'آیا خدمات در شهرستان‌ها هم ارائه می‌شود؟', a: 'بله، لیست استان‌ها و شهرهای تحت پوشش در بخش استان‌های سایت قابل مشاهده است.' },
        { id: 'f3', q: 'گارانتی تجهیزات چگونه است؟', a: 'تمام تجهیزات دارای گارانتی معتبر شرکتی هستند و خدمات نصب نیز شامل پشتیبانی می‌شود.' },
        { id: 'f4', q: 'مدت زمان اجرای پروژه چقدر است؟', a: 'پروژه‌های معمول بین ۱ تا ۵ روز کاری اجرا می‌شوند و پروژه‌های بزرگ طبق زمان‌بندی توافقی پیش می‌روند.' }
      ],
      footer: {
        about: 'آزادی نتورک مجری تخصصی پروژه‌های شبکه، دوربین مداربسته، اینترنت وایرلس و اتاق سرور با یک دهه تجربه اجرایی.',
        copyright: 'تمامی حقوق برای آزادی نتورک محفوظ است.',
        columns: [
          {
            id: 'fc1', title: 'دسترسی سریع', links: [
              { id: 'fl1', label: 'فروشگاه', url: '/shop' },
              { id: 'fl2', label: 'نمونه کارها', url: '/portfolio' },
              { id: 'fl3', label: 'مقالات', url: '/articles' },
              { id: 'fl4', label: 'نشان‌شده‌ها', url: '/saved' }
            ]
          },
          {
            id: 'fc2', title: 'خدمات', links: [
              { id: 'fl5', label: 'نصب دوربین مداربسته', url: '/portfolio?cat=cctv' },
              { id: 'fl6', label: 'اینترنت وایرلس', url: '/portfolio?cat=wireless' },
              { id: 'fl7', label: 'اتاق سرور', url: '/portfolio?cat=server' },
              { id: 'fl8', label: 'پشتیبانی شبکه', url: '/contact' }
            ]
          }
        ]
      },
      contactPage: {
        sections: [
          {
            id: 'cs1', type: 'channels', enabled: true,
            title: 'استعلام قیمت و خرید محصولات',
            subtitle: 'از طریق پیام‌رسان‌های زیر با ما در ارتباط باشید',
            items: [
              { id: 'ch1', icon: 'telegram', label: 'تلگرام', value: '@azadi_network', enabled: true },
              { id: 'ch2', icon: 'whatsapp', label: 'واتساپ', value: '09120000000', enabled: true },
              { id: 'ch3', icon: 'bale', label: 'بله', value: '@azadi_network', enabled: true },
              { id: 'ch4', icon: 'eitaa', label: 'ایتا', value: '@azadi_network', enabled: true },
              { id: 'ch5', icon: 'rubika', label: 'روبیکا', value: '@azadi_network', enabled: true }
            ]
          },
          {
            id: 'cs2', type: 'social', enabled: true,
            title: 'پیج‌های کاری ما',
            subtitle: 'ما را در شبکه‌های اجتماعی دنبال کنید',
            items: [
              { id: 'so1', icon: 'instagram', label: 'اینستاگرام', value: 'azadi.network', enabled: true }
            ]
          },
          {
            id: 'cs3', type: 'info', enabled: true,
            title: 'آدرس و اطلاعات تماس',
            subtitle: '',
            items: [
              { id: 'in1', icon: 'location', label: 'آدرس', value: 'خیابان آزادی، مجتمع فناوری، واحد ۱۲', enabled: true },
              { id: 'in2', icon: 'phone', label: 'تلفن', value: '021-00000000', enabled: true },
              { id: 'in3', icon: 'clock', label: 'ساعات کاری', value: 'شنبه تا پنجشنبه ۹ تا ۱۸', enabled: true }
            ]
          }
        ]
      },
      notifications: {
        backup: true,
        restore: true,
        content: true,
        tracking: false
      }
    },
    stories: [
      { id: 'st1', title: 'پروژه دوربین', type: 'image', media: 'u/story-cctv.svg', caption: 'اجرای پروژه ۱۶ دوربین در مجتمع تجاری', productId: '', order: 1, createdAt: t },
      { id: 'st2', title: 'رادیو وایرلس', type: 'product', media: 'u/story-wireless.svg', caption: 'رادیو وایرلس پرقدرت برای لینک‌های طولانی', productId: 'p2', order: 2, createdAt: t },
      { id: 'st3', title: 'اتاق سرور', type: 'image', media: 'u/story-server.svg', caption: 'استانداردسازی اتاق سرور سازمانی', productId: '', order: 3, createdAt: t }
    ],
    services: [
      { id: 'sv1', title: 'نصب دوربین مداربسته', desc: 'مشاوره، طراحی و اجرای سیستم‌های نظارت تصویری با تجهیزات روز', icon: 'camera', order: 1, enabled: true },
      { id: 'sv2', title: 'نصب اینترنت وایرلس', desc: 'راه‌اندازی لینک‌های وایرلس پرسرعت و پایدار برای هر مسافتی', icon: 'wifi', order: 2, enabled: true },
      { id: 'sv3', title: 'نصب اتاق سرور', desc: 'طراحی و تجهیز اتاق سرور استاندارد با رک، برق اضطراری و خنک‌سازی', icon: 'server', order: 3, enabled: true },
      { id: 'sv4', title: 'پشتیبانی شبکه', desc: 'پشتیبانی دوره‌ای و موردی شبکه‌های سازمانی با قرارداد SLA', icon: 'support', order: 4, enabled: true },
      { id: 'sv5', title: 'برقراری امنیت', desc: 'ایمن‌سازی شبکه، فایروال، کنترل دسترسی و مانیتورینگ امنیتی', icon: 'shield', order: 5, enabled: true }
    ],
    categories: [
      { id: 'c1', name: 'دوربین مداربسته', slug: 'cctv' },
      { id: 'c2', name: 'تجهیزات وایرلس', slug: 'wireless' },
      { id: 'c3', name: 'تجهیزات سرور و رک', slug: 'server' },
      { id: 'c4', name: 'تجهیزات شبکه', slug: 'network' }
    ],
    products: [
      { id: 'p1', code: 'PR-1001', name: 'دوربین بولت 4 مگاپیکسل', desc: 'دوربین تحت شبکه با دید در شب رنگی، ضدآب IP67 و لنز ۳.۶ میلی‌متر', category: 'c1', image: 'u/prod-cam.svg', images: ['u/prod-cam.svg'], featured: true, order: 1, tags: ['دوربین', 'IP', 'نظارتی'], createdAt: t },
      { id: 'p2', code: 'PR-1002', name: 'رادیو وایرلس 5 گیگاهرتز', desc: 'رادیو پرقدرت مخصوص لینک‌های نقطه به نقطه تا ۲۰ کیلومتر', category: 'c2', image: 'u/prod-radio.svg', images: ['u/prod-radio.svg'], featured: true, order: 2, tags: ['وایرلس', 'رادیو'], createdAt: t },
      { id: 'p3', code: 'PR-1003', name: 'رک ایستاده 27 یونیت', desc: 'رک استاندارد عمق ۶۰ با فن سقفی، سینی و مدیریت کابل', category: 'c3', image: 'u/prod-rack.svg', images: ['u/prod-rack.svg'], featured: true, order: 3, tags: ['رک', 'سرور'], createdAt: t },
      { id: 'p4', code: 'PR-1004', name: 'سوییچ 24 پورت گیگابیت', desc: 'سوییچ مدیریتی لایه ۲ با پورت‌های SFP و قابلیت VLAN', category: 'c4', image: 'u/prod-switch.svg', images: ['u/prod-switch.svg'], featured: true, order: 4, tags: ['سوییچ', 'شبکه'], createdAt: t },
      { id: 'p5', code: 'PR-1005', name: 'دستگاه ضبط 16 کانال', desc: 'NVR شانزده کانال با پشتیبانی از دو هارد و خروجی 4K', category: 'c1', image: 'u/prod-nvr.svg', images: ['u/prod-nvr.svg'], featured: false, order: 5, tags: ['ضبط', 'NVR'], createdAt: t },
      { id: 'p6', code: 'PR-1006', name: 'اکسس پوینت سقفی', desc: 'اکسس پوینت دوباند مخصوص محیط‌های پرتراکم اداری', category: 'c2', image: 'u/prod-ap.svg', images: ['u/prod-ap.svg'], featured: false, order: 6, tags: ['وایرلس', 'اکسس پوینت'], createdAt: t }
    ],
    provinces: [
      { id: 'pv1', name: 'تهران', allCities: false, cities: [{ name: 'تهران', active: true }, { name: 'شهریار', active: true }, { name: 'اسلامشهر', active: true }, { name: 'ورامین', active: false }] },
      { id: 'pv2', name: 'البرز', allCities: true, cities: [{ name: 'کرج', active: true }, { name: 'فردیس', active: true }, { name: 'نظرآباد', active: true }] },
      { id: 'pv3', name: 'اصفهان', allCities: false, cities: [{ name: 'اصفهان', active: true }, { name: 'کاشان', active: true }, { name: 'نجف‌آباد', active: false }] },
      { id: 'pv4', name: 'فارس', allCities: false, cities: [{ name: 'شیراز', active: true }, { name: 'مرودشت', active: false }] },
      { id: 'pv5', name: 'خراسان رضوی', allCities: false, cities: [{ name: 'مشهد', active: true }, { name: 'نیشابور', active: true }] }
    ],
    articles: [
      {
        id: 'a1', code: 'AR-2001', title: 'راهنمای انتخاب دوربین مداربسته مناسب', topic: 'نظارت تصویری',
        desc: 'در این آموزش قدم به قدم یاد می‌گیرید چگونه دوربین مناسب فضای خود را انتخاب کنید.',
        cover: 'u/art-cctv.svg', font: 'vazir', published: true, createdAt: t,
        blocks: [
          { id: 'b1', type: 'text', text: 'انتخاب دوربین مداربسته مناسب به عوامل مختلفی مانند محیط نصب، میزان نور و بودجه بستگی دارد. در این مقاله معیارهای اصلی را بررسی می‌کنیم.' },
          { id: 'b2', type: 'steps', title: 'مراحل انتخاب', steps: ['ابتدا محیط نصب را مشخص کنید: داخلی یا خارجی', 'رزولوشن مورد نیاز را بر اساس فاصله سوژه انتخاب کنید', 'به دید در شب و برد مادون قرمز توجه کنید', 'نوع لنز ثابت یا وریفوکال را انتخاب کنید', 'برند و گارانتی معتبر را بررسی کنید'] },
          { id: 'b3', type: 'image', src: 'u/art-cctv.svg', caption: 'نمای کلی انواع دوربین' },
          { id: 'b4', type: 'text', text: 'برای محیط‌های بیرونی حتما دوربین با استاندارد ضدآب IP66 به بالا انتخاب کنید و از منبع تغذیه با کیفیت استفاده نمایید.' }
        ]
      },
      {
        id: 'a2', code: 'AR-2002', title: 'آموزش راه‌اندازی لینک وایرلس نقطه به نقطه', topic: 'شبکه وایرلس',
        desc: 'صفر تا صد برقراری یک لینک وایرلس پایدار بین دو ساختمان.',
        cover: 'u/art-wireless.svg', font: 'vazir', published: true, createdAt: t,
        blocks: [
          { id: 'b1', type: 'text', text: 'لینک‌های وایرلس نقطه به نقطه راهکاری مقرون به صرفه برای اتصال دو ساختمان بدون کابل‌کشی هستند.' },
          { id: 'b2', type: 'steps', title: 'مراحل راه‌اندازی', steps: ['دید مستقیم بین دو نقطه را بررسی کنید', 'فرکانس مناسب و کانال خلوت را انتخاب کنید', 'رادیوها را با زاویه دقیق نصب و تنظیم کنید', 'امنیت لینک را با رمزنگاری WPA2 برقرار کنید', 'پایداری لینک را با تست پینگ طولانی بسنجید'] },
          { id: 'b3', type: 'image', src: 'u/art-wireless.svg', caption: 'شمای کلی لینک وایرلس' }
        ]
      },
      {
        id: 'a3', code: 'AR-2003', title: 'استاندارد‌های اتاق سرور که باید بدانید', topic: 'اتاق سرور',
        desc: 'مروری بر الزامات دما، برق، امنیت و چیدمان استاندارد اتاق سرور.',
        cover: 'u/art-server.svg', font: 'vazir', published: true, createdAt: t,
        blocks: [
          { id: 'b1', type: 'text', text: 'اتاق سرور قلب زیرساخت فناوری هر سازمان است و رعایت استانداردها در آن حیاتی است.' },
          { id: 'b2', type: 'steps', title: 'الزامات اصلی', steps: ['دمای محیط بین ۱۸ تا ۲۴ درجه نگه داشته شود', 'برق اضطراری و UPS با ظرفیت مناسب پیش‌بینی شود', 'کف و سقف کاذب استاندارد اجرا شود', 'کنترل دسترسی و دوربین نظارتی نصب شود', 'سیستم اعلام و اطفای حریق مخصوص نصب شود'] }
        ]
      }
    ],
    portfolio: [
      {
        id: 'w1', code: 'WK-3001', title: 'نصب ۱۶ دوربین مجتمع تجاری نور', category: 'c1',
        desc: 'اجرای کامل سیستم نظارت تصویری شامل کابل‌کشی، نصب دوربین و راه‌اندازی ضبط تحت شبکه',
        cover: 'u/work-cctv.svg', media: [{ type: 'image', src: 'u/work-cctv.svg' }, { type: 'image', src: 'u/work-cctv2.svg' }],
        featuredHome: true, featuredTop: true, createdAt: t,
        blocks: [
          { id: 'b1', type: 'text', text: 'در این پروژه ۱۶ دوربین ۴ مگاپیکسل تحت شبکه در سه طبقه مجتمع نصب شد. کابل‌کشی به صورت کامل با کابل شبکه بیرونی و داکت انجام گرفت.' },
          { id: 'b2', type: 'steps', title: 'مراحل اجرا', steps: ['بازدید و جانمایی نقاط نصب', 'کابل‌کشی و داکت‌گذاری', 'نصب و تنظیم دوربین‌ها', 'راه‌اندازی NVR و انتقال تصویر', 'آموزش بهره‌برداری به کارفرما'] }
        ]
      },
      {
        id: 'w2', code: 'WK-3002', title: 'لینک وایرلس ۸ کیلومتری کارخانه', category: 'c2',
        desc: 'برقراری لینک اختصاصی پایدار بین دفتر مرکزی و کارخانه با رادیوهای ۵ گیگاهرتز',
        cover: 'u/work-wireless.svg', media: [{ type: 'image', src: 'u/work-wireless.svg' }],
        featuredHome: true, featuredTop: false, createdAt: t,
        blocks: [
          { id: 'b1', type: 'text', text: 'لینک وایرلس اختصاصی با پهنای باند پایدار ۱۵۰ مگابیت بین دو سایت برقرار شد و ترافیک دوربین‌ها و تلفن سازمانی از طریق آن منتقل می‌شود.' }
        ]
      },
      {
        id: 'w3', code: 'WK-3003', title: 'تجهیز اتاق سرور شرکت بازرگانی', category: 'c3',
        desc: 'طراحی و اجرای اتاق سرور استاندارد با رک، UPS و سیستم خنک‌سازی',
        cover: 'u/work-server.svg', media: [{ type: 'image', src: 'u/work-server.svg' }],
        featuredHome: true, featuredTop: false, createdAt: t,
        blocks: [
          { id: 'b1', type: 'text', text: 'اتاق سرور با رک ۴۲ یونیت، برق اضطراری و مانیتورینگ دما تجهیز شد و کلیه سرویس‌های شرکت به آن منتقل گردید.' }
        ]
      }
    ],
    meta: { createdAt: t, version: 1 }
  };
}

module.exports = { seed: seed };
