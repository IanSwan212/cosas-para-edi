// Mensaje personal mostrado al seleccionar una palabra.
// Solo se incluyen idiomas cuya traducción el autor puede escribir con fluidez;
// para el resto se muestra el original en español (ver getMessage).
// Traducciones no revisadas por hablantes nativos.

import { AUTO_MESSAGES } from "./messagesAuto.js?v=mvq5j85t";

const CHORUS_REPEATS = 10;

const MESSAGES = {
  es: {
    chorus: "Te amo tanto",
    lines: [
      "Es que te amo tanto, amo nuestra amistad",
      "También amo cada parte de ti",
      "Amo tu pelo, tus músculos, tu humor, tus dientes de vampiro, tu olor",
      "Especialmente cuando no te bañas",
      "Amo cuando te emocionas y se te llenan los ojitos de lágrimas",
      "Amo tu bondad, tu seguridad, amo cómo comes",
      "Amo tus pies, tus manos, tu ombligo, tu cuello",
      "Lo que más amo en la vida es verte sonreír",
      "Con esa sonrisa linda que haces cuando levantas los hombros",
      "Y pones la cabeza de lado y cierras los ojitos",
      "Lo que más amo en la vida es tu sonrisa",
      "Justo ahora pensé que faltan solo unos días para verte",
      "Y por fin tocarte y olerte",
      "Creo que es lo más hermoso que puedo experimentar en la vida",
      "El amarte como te amo",
      "Te amo en el agua, en lo más profundo, en el faro a medianoche"
    ]
  },
  en: {
    chorus: "I love you so much",
    lines: [
      "I just love you so much, I love our friendship",
      "I also love every part of you",
      "I love your hair, your muscles, your humor, your vampire teeth, your smell",
      "Especially when you haven't showered",
      "I love it when you get emotional and your little eyes fill with tears",
      "I love your kindness, your confidence, I love the way you eat",
      "I love your feet, your hands, your belly button, your neck",
      "What I love most in life is seeing you smile",
      "With that cute smile you make when you shrug your shoulders",
      "And tilt your head and close your little eyes",
      "What I love most in life is your smile",
      "Just now I realized there are only a few days left until I see you",
      "And can finally touch you and smell you",
      "I think it's the most beautiful thing I can experience in life",
      "Loving you the way I love you",
      "I love you in the water, in the deepest depths, at the lighthouse at midnight"
    ]
  },
  fr: {
    chorus: "Je t'aime tellement",
    lines: [
      "C'est que je t'aime tellement, j'aime notre amitié",
      "J'aime aussi chaque partie de toi",
      "J'aime tes cheveux, tes muscles, ton humour, tes dents de vampire, ton odeur",
      "Surtout quand tu ne prends pas de douche",
      "J'aime quand tu t'émeus et que tes petits yeux se remplissent de larmes",
      "J'aime ta bonté, ton assurance, j'aime ta façon de manger",
      "J'aime tes pieds, tes mains, ton nombril, ton cou",
      "Ce que j'aime le plus dans la vie, c'est te voir sourire",
      "Avec ce joli sourire que tu fais quand tu hausses les épaules",
      "Que tu penches la tête et fermes tes petits yeux",
      "Ce que j'aime le plus dans la vie, c'est ton sourire",
      "Je viens de penser qu'il ne reste que quelques jours avant de te voir",
      "Et enfin te toucher et te sentir",
      "Je crois que c'est la plus belle chose que je puisse vivre",
      "T'aimer comme je t'aime",
      "Je t'aime dans l'eau, au plus profond, au phare à minuit"
    ]
  },
  it: {
    chorus: "Ti amo così tanto",
    lines: [
      "È che ti amo così tanto, amo la nostra amicizia",
      "Amo anche ogni parte di te",
      "Amo i tuoi capelli, i tuoi muscoli, il tuo umorismo, i tuoi denti da vampiro, il tuo odore",
      "Soprattutto quando non ti fai la doccia",
      "Amo quando ti emozioni e i tuoi occhietti si riempiono di lacrime",
      "Amo la tua bontà, la tua sicurezza, amo come mangi",
      "Amo i tuoi piedi, le tue mani, il tuo ombelico, il tuo collo",
      "Ciò che amo di più nella vita è vederti sorridere",
      "Con quel sorriso bellissimo che fai quando alzi le spalle",
      "E pieghi la testa di lato e chiudi gli occhietti",
      "Ciò che amo di più nella vita è il tuo sorriso",
      "Proprio adesso ho pensato che mancano solo pochi giorni per vederti",
      "E finalmente toccarti e sentire il tuo odore",
      "Credo che sia la cosa più bella che io possa vivere",
      "Amarti come ti amo",
      "Ti amo nell'acqua, nel più profondo, al faro a mezzanotte"
    ]
  },
  pt: {
    chorus: "Eu te amo tanto",
    lines: [
      "É que eu te amo tanto, amo a nossa amizade",
      "Também amo cada parte de você",
      "Amo seu cabelo, seus músculos, seu humor, seus dentes de vampiro, seu cheiro",
      "Principalmente quando você não toma banho",
      "Amo quando você se emociona e seus olhinhos se enchem de lágrimas",
      "Amo sua bondade, sua segurança, amo o jeito que você come",
      "Amo seus pés, suas mãos, seu umbigo, seu pescoço",
      "O que eu mais amo na vida é te ver sorrir",
      "Com aquele sorriso lindo que você faz quando levanta os ombros",
      "E inclina a cabeça e fecha os olhinhos",
      "O que eu mais amo na vida é o seu sorriso",
      "Agora mesmo pensei que faltam só alguns dias para te ver",
      "E finalmente te tocar e sentir seu cheiro",
      "Acho que é a coisa mais linda que posso viver",
      "Te amar como eu te amo",
      "Te amo na água, no mais profundo, no farol à meia-noite"
    ]
  },
  de: {
    chorus: "Ich liebe dich so sehr",
    lines: [
      "Ich liebe dich einfach so sehr, ich liebe unsere Freundschaft",
      "Ich liebe auch jeden Teil von dir",
      "Ich liebe deine Haare, deine Muskeln, deinen Humor, deine Vampirzähne, deinen Duft",
      "Besonders, wenn du nicht geduscht hast",
      "Ich liebe es, wenn du gerührt bist und sich deine Äuglein mit Tränen füllen",
      "Ich liebe deine Güte, deine Selbstsicherheit, ich liebe, wie du isst",
      "Ich liebe deine Füße, deine Hände, deinen Bauchnabel, deinen Hals",
      "Was ich am meisten im Leben liebe, ist, dich lächeln zu sehen",
      "Mit diesem süßen Lächeln, wenn du die Schultern hochziehst",
      "Den Kopf zur Seite neigst und die Äuglein schließt",
      "Was ich am meisten im Leben liebe, ist dein Lächeln",
      "Gerade eben dachte ich, dass es nur noch ein paar Tage sind, bis ich dich sehe",
      "Und dich endlich berühren und riechen kann",
      "Ich glaube, das ist das Schönste, was ich im Leben erfahren kann",
      "Dich so zu lieben, wie ich dich liebe",
      "Ich liebe dich im Wasser, in der tiefsten Tiefe, am Leuchtturm um Mitternacht"
    ]
  },
  ca: {
    chorus: "T'estimo tant",
    lines: [
      "És que t'estimo tant, estimo la nostra amistat",
      "També estimo cada part de tu",
      "Estimo els teus cabells, els teus músculs, el teu humor, les teves dents de vampir, la teva olor",
      "Sobretot quan no et dutxes",
      "M'encanta quan t'emociones i els ullets se t'omplen de llàgrimes",
      "Estimo la teva bondat, la teva seguretat, m'encanta com menges",
      "Estimo els teus peus, les teves mans, el teu melic, el teu coll",
      "El que més estimo a la vida és veure't somriure",
      "Amb aquell somriure tan bonic que fas quan aixeques les espatlles",
      "I inclines el cap i tanques els ullets",
      "El que més estimo a la vida és el teu somriure",
      "Ara mateix he pensat que només falten uns dies per veure't",
      "I per fi tocar-te i olorar-te",
      "Crec que és el més bonic que puc viure",
      "Estimar-te com t'estimo",
      "T'estimo a l'aigua, al més profund, al far a mitjanit"
    ]
  },
  nl: {
    chorus: "Ik hou zoveel van je",
    lines: [
      "Ik hou gewoon zoveel van je, ik hou van onze vriendschap",
      "Ik hou ook van elk deel van jou",
      "Ik hou van je haar, je spieren, je humor, je vampiertanden, je geur",
      "Vooral als je niet gedoucht hebt",
      "Ik hou ervan als je ontroerd raakt en je oogjes vollopen met tranen",
      "Ik hou van je goedheid, je zelfvertrouwen, ik hou van hoe je eet",
      "Ik hou van je voeten, je handen, je navel, je nek",
      "Wat ik het meest in het leven liefheb, is jou zien lachen",
      "Met die lieve glimlach die je maakt als je je schouders ophaalt",
      "Je hoofd scheef houdt en je oogjes dichtdoet",
      "Wat ik het meest in het leven liefheb, is jouw glimlach",
      "Net dacht ik dat het nog maar een paar dagen is tot ik je zie",
      "En je eindelijk kan aanraken en ruiken",
      "Ik denk dat het het mooiste is wat ik in het leven kan meemaken",
      "Van je houden zoals ik van je hou",
      "Ik hou van je in het water, in het diepst, bij de vuurtoren om middernacht"
    ]
  },
  sv: {
    chorus: "Jag älskar dig så mycket",
    lines: [
      "Jag älskar dig bara så mycket, jag älskar vår vänskap",
      "Jag älskar också varje del av dig",
      "Jag älskar ditt hår, dina muskler, din humor, dina vampyrtänder, din doft",
      "Särskilt när du inte har duschat",
      "Jag älskar när du blir rörd och dina små ögon fylls med tårar",
      "Jag älskar din godhet, din självsäkerhet, jag älskar hur du äter",
      "Jag älskar dina fötter, dina händer, din navel, din hals",
      "Det jag älskar mest i livet är att se dig le",
      "Med det fina leendet du gör när du drar upp axlarna",
      "Och lägger huvudet på sned och blundar",
      "Det jag älskar mest i livet är ditt leende",
      "Precis nu tänkte jag att det bara är några dagar kvar tills jag får se dig",
      "Och äntligen röra vid dig och känna din doft",
      "Jag tror att det är det vackraste jag kan uppleva i livet",
      "Att älska dig så som jag älskar dig",
      "Jag älskar dig i vattnet, på djupaste djupet, vid fyren vid midnatt"
    ]
  },
  tr: {
    chorus: "Seni çok seviyorum",
    lines: [
      "Seni o kadar çok seviyorum ki, arkadaşlığımızı seviyorum",
      "Senin her parçanı da seviyorum",
      "Saçlarını, kaslarını, mizahını, vampir dişlerini, kokunu seviyorum",
      "Özellikle yıkanmadığın zamanlarda",
      "Duygulanıp gözlerinin yaşlarla dolmasını seviyorum",
      "İyiliğini, özgüvenini seviyorum, yemek yiyişini seviyorum",
      "Ayaklarını, ellerini, göbeğini, boynunu seviyorum",
      "Hayatta en çok sevdiğim şey seni gülümserken görmek",
      "Omuzlarını kaldırdığında yaptığın o tatlı gülümsemeyle",
      "Başını yana eğip gözlerini kapattığında",
      "Hayatta en çok sevdiğim şey senin gülüşün",
      "Az önce seni görmeme sadece birkaç gün kaldığını düşündüm",
      "Ve sonunda sana dokunup seni koklayacağımı",
      "Bence bu hayatta yaşayabileceğim en güzel şey",
      "Seni sevdiğim gibi sevmek",
      "Seni suda, en derinde, gece yarısı deniz fenerinde seviyorum"
    ]
  },
  id: {
    chorus: "Aku sangat mencintaimu",
    lines: [
      "Aku sangat mencintaimu, aku mencintai persahabatan kita",
      "Aku juga mencintai setiap bagian dirimu",
      "Aku cinta rambutmu, ototmu, humormu, gigi vampirmu, aromamu",
      "Terutama saat kamu belum mandi",
      "Aku cinta saat kamu terharu dan matamu berkaca-kaca",
      "Aku cinta kebaikanmu, rasa percaya dirimu, aku cinta caramu makan",
      "Aku cinta kakimu, tanganmu, pusarmu, lehermu",
      "Yang paling aku cintai dalam hidup adalah melihatmu tersenyum",
      "Dengan senyum manis yang kamu buat saat mengangkat bahu",
      "Lalu memiringkan kepala dan memejamkan mata",
      "Yang paling aku cintai dalam hidup adalah senyummu",
      "Barusan aku berpikir tinggal beberapa hari lagi sampai aku bertemu denganmu",
      "Dan akhirnya bisa menyentuhmu dan menghirup aromamu",
      "Kurasa itu hal terindah yang bisa kualami dalam hidup",
      "Mencintaimu seperti aku mencintaimu",
      "Aku mencintaimu di dalam air, di tempat terdalam, di mercusuar tengah malam"
    ]
  },
  ja: {
    chorus: "とても愛してる",
    lines: [
      "本当にあなたを愛してる。私たちの友情も大好き",
      "あなたのすべてが愛おしい",
      "髪も、筋肉も、ユーモアも、吸血鬼みたいな歯も、においも",
      "特にお風呂に入っていないときのにおいも",
      "感動して目がうるうるするところが好き",
      "優しさも、自信も、食べ方も好き",
      "足も、手も、おへそも、首も好き",
      "人生でいちばん好きなのは、あなたの笑顔を見ること",
      "肩をすくめて見せる、あのかわいい笑顔",
      "首をかしげて目を閉じるときの",
      "人生でいちばん好きなのは、あなたの笑顔",
      "ちょうど今、あと数日で会えるって思った",
      "やっと触れて、においを感じられる",
      "これが人生でいちばん美しいことだと思う",
      "こんなにあなたを愛していること",
      "水の中でも、いちばん深いところでも、真夜中の灯台でも愛してる"
    ]
  },
  ko: {
    chorus: "너무 사랑해",
    lines: [
      "너를 정말 너무 사랑해, 우리의 우정도 사랑해",
      "너의 모든 부분을 사랑해",
      "네 머리카락, 근육, 유머, 뱀파이어 같은 이빨, 네 냄새를 사랑해",
      "특히 씻지 않았을 때",
      "감동해서 눈에 눈물이 가득 고일 때를 사랑해",
      "너의 착함, 자신감, 그리고 네가 먹는 모습을 사랑해",
      "네 발, 손, 배꼽, 목을 사랑해",
      "내가 세상에서 가장 사랑하는 건 네가 웃는 모습이야",
      "어깨를 으쓱하며 짓는 그 예쁜 미소",
      "고개를 갸웃하고 눈을 감을 때",
      "내가 세상에서 가장 사랑하는 건 너의 미소야",
      "방금, 며칠만 있으면 너를 만난다는 생각을 했어",
      "드디어 너를 만지고 네 냄새를 맡을 수 있어",
      "이게 내가 살면서 경험할 수 있는 가장 아름다운 일인 것 같아",
      "너를 이렇게 사랑하는 것",
      "물속에서도, 가장 깊은 곳에서도, 한밤중의 등대에서도 사랑해"
    ]
  },
  "zh-Hans": {
    chorus: "我好爱你",
    lines: [
      "我真的好爱你，我爱我们的友谊",
      "我也爱你的每一部分",
      "我爱你的头发、你的肌肉、你的幽默、你的吸血鬼牙齿、你的味道",
      "尤其是你没洗澡的时候",
      "我爱你感动时眼里充满泪水的样子",
      "我爱你的善良、你的自信，我爱你吃东西的样子",
      "我爱你的脚、你的手、你的肚脐、你的脖子",
      "我这辈子最爱的，是看你笑",
      "那个你耸起肩膀时露出的可爱笑容",
      "歪着头、闭上眼睛",
      "我这辈子最爱的，是你的笑容",
      "刚刚我想到，再过几天就能见到你了",
      "终于可以摸到你、闻到你",
      "我觉得这是我这一生能经历的最美好的事",
      "像这样爱着你",
      "我在水里爱你，在最深处爱你，在午夜的灯塔爱你"
    ]
  },
  "zh-Hant": {
    chorus: "我好愛你",
    lines: [
      "我真的好愛你，我愛我們的友誼",
      "我也愛你的每一部分",
      "我愛你的頭髮、你的肌肉、你的幽默、你的吸血鬼牙齒、你的味道",
      "尤其是你沒洗澡的時候",
      "我愛你感動時眼裡充滿淚水的樣子",
      "我愛你的善良、你的自信，我愛你吃東西的樣子",
      "我愛你的腳、你的手、你的肚臍、你的脖子",
      "我這輩子最愛的，是看你笑",
      "那個你聳起肩膀時露出的可愛笑容",
      "歪著頭、閉上眼睛",
      "我這輩子最愛的，是你的笑容",
      "剛剛我想到，再過幾天就能見到你了",
      "終於可以摸到你、聞到你",
      "我覺得這是我這一生能經歷的最美好的事",
      "像這樣愛著你",
      "我在水裡愛你，在最深處愛你，在午夜的燈塔愛你"
    ]
  },
  ro: {
    chorus: "Te iubesc atât de mult",
    lines: [
      "Te iubesc atât de mult, iubesc prietenia noastră",
      "Iubesc și fiecare părticică din tine",
      "Îți iubesc părul, mușchii, umorul, dinții de vampir, mirosul",
      "Mai ales când nu te speli",
      "Iubesc când te emoționezi și ți se umplu ochișorii de lacrimi",
      "Îți iubesc bunătatea, siguranța, iubesc felul în care mănânci",
      "Îți iubesc picioarele, mâinile, buricul, gâtul",
      "Ce iubesc cel mai mult în viață e să te văd zâmbind",
      "Cu zâmbetul acela frumos pe care îl faci când ridici din umeri",
      "Și îți înclini capul într-o parte și închizi ochișorii",
      "Ce iubesc cel mai mult în viață e zâmbetul tău",
      "Chiar acum m-am gândit că mai sunt doar câteva zile până te văd",
      "Și în sfârșit să te ating și să te miros",
      "Cred că e cel mai frumos lucru pe care îl pot trăi",
      "Să te iubesc așa cum te iubesc",
      "Te iubesc în apă, în cel mai adânc loc, la far la miezul nopții"
    ]
  },
  da: {
    chorus: "Jeg elsker dig så højt",
    lines: [
      "Jeg elsker dig bare så højt, jeg elsker vores venskab",
      "Jeg elsker også hver eneste del af dig",
      "Jeg elsker dit hår, dine muskler, din humor, dine vampyrtænder, din duft",
      "Især når du ikke har været i bad",
      "Jeg elsker, når du bliver rørt, og dine små øjne fyldes med tårer",
      "Jeg elsker din godhed, din selvsikkerhed, jeg elsker, hvordan du spiser",
      "Jeg elsker dine fødder, dine hænder, din navle, din hals",
      "Det, jeg elsker mest i livet, er at se dig smile",
      "Med det søde smil, du laver, når du trækker på skuldrene",
      "Og lægger hovedet på skrå og lukker dine små øjne",
      "Det, jeg elsker mest i livet, er dit smil",
      "Lige nu tænkte jeg, at der kun er få dage, til jeg ser dig",
      "Og endelig kan røre ved dig og dufte til dig",
      "Jeg tror, det er det smukkeste, jeg kan opleve i livet",
      "At elske dig, sådan som jeg elsker dig",
      "Jeg elsker dig i vandet, i det dybeste dyb, ved fyrtårnet ved midnat"
    ]
  },
  nb: {
    chorus: "Jeg elsker deg så høyt",
    lines: [
      "Jeg elsker deg bare så høyt, jeg elsker vennskapet vårt",
      "Jeg elsker også hver eneste del av deg",
      "Jeg elsker håret ditt, musklene dine, humoren din, vampyrtennene dine, lukten din",
      "Spesielt når du ikke har dusjet",
      "Jeg elsker når du blir rørt og de små øynene dine fylles med tårer",
      "Jeg elsker godheten din, selvsikkerheten din, jeg elsker måten du spiser på",
      "Jeg elsker føttene dine, hendene dine, navlen din, halsen din",
      "Det jeg elsker mest i livet, er å se deg smile",
      "Med det søte smilet du lager når du trekker på skuldrene",
      "Og legger hodet på skrå og lukker de små øynene",
      "Det jeg elsker mest i livet, er smilet ditt",
      "Akkurat nå tenkte jeg at det bare er noen få dage til jeg ser deg",
      "Og endelig kan ta på deg og kjenne lukten din",
      "Jeg tror det er det vakreste jeg kan oppleve i livet",
      "Å elske deg sånn som jeg elsker deg",
      "Jeg elsker deg i vannet, i det dypeste dyp, ved fyret ved midnatt"
    ]
  },
  gl: {
    chorus: "Quérote moito",
    lines: [
      "É que te quero moitísimo, quero a nosa amizade",
      "Tamén quero cada parte de ti",
      "Quero o teu pelo, os teus músculos, o teu humor, os teus dentes de vampiro, o teu cheiro",
      "Sobre todo cando non te bañas",
      "Encántame cando te emocionas e se che enchen os olliños de bágoas",
      "Quero a túa bondade, a túa seguridade, encántame como comes",
      "Quero os teus pés, as túas mans, o teu embigo, o teu pescozo",
      "O que máis quero na vida é verte sorrir",
      "Con ese sorriso bonito que fas cando levantas os ombreiros",
      "E pos a cabeza de lado e pechas os olliños",
      "O que máis quero na vida é o teu sorriso",
      "Agora mesmo pensei que só faltan uns días para verte",
      "E por fin tocarte e cheirarte",
      "Creo que é o máis fermoso que podo vivir",
      "Quererte como te quero",
      "Quérote na auga, no máis profundo, no faro á medianoite"
    ]
  },
  eo: {
    chorus: "Mi tiel amas vin",
    lines: [
      "Mi tiel amas vin, mi amas nian amikecon",
      "Mi ankaŭ amas ĉiun parton de vi",
      "Mi amas viajn harojn, viajn muskolojn, vian humuron, viajn vampirajn dentojn, vian odoron",
      "Precipe kiam vi ne lavis vin",
      "Mi amas, kiam vi emociiĝas kaj viaj okuletoj pleniĝas de larmoj",
      "Mi amas vian bonkorecon, vian memfidon, mi amas kiel vi manĝas",
      "Mi amas viajn piedojn, viajn manojn, vian umbilikon, vian kolon",
      "Kion mi plej amas en la vivo, estas vidi vin rideti",
      "Per tiu bela rideto, kiun vi faras, kiam vi levas la ŝultrojn",
      "Kaj klinas la kapon flanken kaj fermas la okuletojn",
      "Kion mi plej amas en la vivo, estas via rideto",
      "Ĝuste nun mi pensis, ke restas nur kelkaj tagoj ĝis mi vidos vin",
      "Kaj fine tuŝos kaj flaros vin",
      "Mi kredas, ke tio estas la plej bela afero, kiun mi povas sperti en la vivo",
      "Ami vin tiel, kiel mi amas vin",
      "Mi amas vin en la akvo, en la plej profunda loko, ĉe la lumturo je noktomezo"
    ]
  },
  pl: {
    chorus: "Tak bardzo cię kocham",
    lines: [
      "Tak bardzo cię kocham, kocham naszą przyjaźń",
      "Kocham też każdą część ciebie",
      "Kocham twoje włosy, twoje mięśnie, twoje poczucie humoru, twoje wampirze zęby, twój zapach",
      "Zwłaszcza kiedy się nie kąpiesz",
      "Kocham, kiedy się wzruszasz i twoje oczka napełniają się łzami",
      "Kocham twoją dobroć, twoją pewność siebie, kocham to, jak jesz",
      "Kocham twoje stopy, twoje dłonie, twój pępek, twoją szyję",
      "To, co najbardziej kocham w życiu, to widzieć twój uśmiech",
      "Ten śliczny uśmiech, kiedy wzruszasz ramionami",
      "Przechylasz głowę na bok i zamykasz oczka",
      "To, co najbardziej kocham w życiu, to twój uśmiech",
      "Właśnie przyszło mi do głowy, że zostało tylko kilka dni, zanim cię zobaczę",
      "I w końcu cię dotknę i poczuję twój zapach",
      "Myślę, że to najpiękniejsza rzecz, jakiej mogę doświadczyć w życiu",
      "Kochać cię tak, jak cię kocham",
      "Kocham cię w wodzie, w najgłębszej głębi, przy latarni morskiej o północy"
    ]
  },
  ru: {
    chorus: "Я так тебя люблю",
    lines: [
      "Я так сильно тебя люблю, люблю нашу дружбу",
      "Я люблю каждую частичку тебя",
      "Люблю твои волосы, твои мышцы, твой юмор, твои вампирские зубы, твой запах",
      "Особенно когда ты не моешься",
      "Люблю, когда ты расчувствуешься и твои глазки наполняются слезами",
      "Люблю твою доброту, твою уверенность, люблю, как ты ешь",
      "Люблю твои ступни, твои руки, твой пупок, твою шею",
      "Больше всего в жизни я люблю видеть, как ты улыбаешься",
      "Той милой улыбкой, когда ты пожимаешь плечами",
      "Наклоняешь голову набок и закрываешь глазки",
      "Больше всего в жизни я люблю твою улыбку",
      "Только что мне пришло в голову, что до встречи с тобой осталось всего несколько дней",
      "И наконец я смогу прикоснуться к тебе и вдохнуть твой запах",
      "Думаю, это самое прекрасное, что я могу испытать в жизни",
      "Любить тебя так, как я тебя люблю",
      "Я люблю тебя в воде, в самой глубине, у маяка в полночь"
    ]
  },
  uk: {
    chorus: "Я так тебе кохаю",
    lines: [
      "Я так сильно тебе кохаю, кохаю нашу дружбу",
      "Я кохаю кожну частинку тебе",
      "Кохаю твоє волосся, твої м'язи, твій гумор, твої вампірські зуби, твій запах",
      "Особливо коли ти не приймаєш душ",
      "Кохаю, коли ти зворушуєшся і твої оченята наповнюються сльозами",
      "Кохаю твою доброту, твою впевненість, кохаю, як ти їси",
      "Кохаю твої ступні, твої руки, твій пупок, твою шию",
      "Найбільше в житті я люблю бачити, як ти усміхаєшся",
      "Тією милою усмішкою, коли ти знизуєш плечима",
      "Нахиляєш голову набік і заплющуєш оченята",
      "Найбільше в житті я люблю твою усмішку",
      "Щойно мені спало на думку, що до зустрічі з тобою залишилося лише кілька днів",
      "І нарешті я зможу торкнутися тебе і відчути твій запах",
      "Думаю, це найпрекрасніше, що я можу пережити в житті",
      "Кохати тебе так, як я тебе кохаю",
      "Я кохаю тебе у воді, в найглибшій глибині, біля маяка опівночі"
    ]
  },
  tl: {
    chorus: "Mahal na mahal kita",
    lines: [
      "Mahal na mahal kita, mahal ko ang ating pagkakaibigan",
      "Mahal ko rin ang bawat bahagi mo",
      "Mahal ko ang buhok mo, ang mga muscle mo, ang pagpapatawa mo, ang mga ngiping-bampira mo, ang amoy mo",
      "Lalo na kapag hindi ka naliligo",
      "Mahal ko kapag naaantig ka at napupuno ng luha ang mga mata mo",
      "Mahal ko ang kabaitan mo, ang tiwala mo sa sarili, mahal ko kung paano ka kumain",
      "Mahal ko ang mga paa mo, ang mga kamay mo, ang pusod mo, ang leeg mo",
      "Ang pinakamamahal ko sa buhay ay makita kang ngumiti",
      "Sa magandang ngiting iyon kapag itinataas mo ang mga balikat mo",
      "At ikinikiling ang ulo at ipinipikit ang mga mata mo",
      "Ang pinakamamahal ko sa buhay ay ang ngiti mo",
      "Ngayon lang naisip ko na ilang araw na lang at makikita na kita",
      "At sa wakas ay mahahawakan at maaamoy kita",
      "Sa tingin ko, ito ang pinakamagandang mararanasan ko sa buhay",
      "Ang mahalin ka nang ganito",
      "Mahal kita sa tubig, sa pinakamalalim, sa parola sa hatinggabi"
    ]
  },
  el: {
    chorus: "Σ' αγαπώ τόσο πολύ",
    lines: [
      "Σ' αγαπώ τόσο πολύ, αγαπώ τη φιλία μας",
      "Αγαπώ επίσης κάθε κομμάτι σου",
      "Αγαπώ τα μαλλιά σου, τους μύες σου, το χιούμορ σου, τα δόντια βαμπίρ σου, τη μυρωδιά σου",
      "Ειδικά όταν δεν έχεις κάνει μπάνιο",
      "Αγαπώ όταν συγκινείσαι και τα ματάκια σου γεμίζουν δάκρυα",
      "Αγαπώ την καλοσύνη σου, τη σιγουριά σου, αγαπώ τον τρόπο που τρως",
      "Αγαπώ τα πόδια σου, τα χέρια σου, τον αφαλό σου, τον λαιμό σου",
      "Αυτό που αγαπώ περισσότερο στη ζωή είναι να σε βλέπω να χαμογελάς",
      "Με εκείνο το όμορφο χαμόγελο που κάνεις όταν σηκώνεις τους ώμους",
      "Και γέρνεις το κεφάλι στο πλάι και κλείνεις τα ματάκια σου",
      "Αυτό που αγαπώ περισσότερο στη ζωή είναι το χαμόγελό σου",
      "Μόλις σκέφτηκα ότι μένουν μόνο λίγες μέρες για να σε δω",
      "Και επιτέλους να σε αγγίξω και να σε μυρίσω",
      "Νομίζω ότι είναι το πιο όμορφο πράγμα που μπορώ να ζήσω",
      "Να σε αγαπώ όπως σε αγαπώ",
      "Σ' αγαπώ στο νερό, στα πιο βαθιά, στον φάρο τα μεσάνυχτα"
    ]
  },
  cs: {
    chorus: "Tolik tě miluju",
    lines: [
      "Tolik tě miluju, miluju naše přátelství",
      "Miluju taky každou část tebe",
      "Miluju tvoje vlasy, tvoje svaly, tvůj humor, tvoje upíří zuby, tvou vůni",
      "Hlavně když se nesprchuješ",
      "Miluju, když se dojmeš a oči se ti zalijí slzami",
      "Miluju tvou laskavost, tvou jistotu, miluju, jak jíš",
      "Miluju tvoje chodidla, tvoje ruce, tvůj pupík, tvůj krk",
      "Nejvíc v životě miluju vidět tě usmívat se",
      "S tím krásným úsměvem, když pokrčíš rameny",
      "Nakloníš hlavu na stranu a zavřeš oči",
      "Nejvíc v životě miluju tvůj úsměv",
      "Právě mě napadlo, že zbývá jen pár dní, než tě uvidím",
      "A konečně se tě dotknu a ucítím tvou vůni",
      "Myslím, že je to to nejkrásnější, co můžu v životě zažít",
      "Milovat tě tak, jak tě miluju",
      "Miluju tě ve vodě, v té největší hloubce, u majáku o půlnoci"
    ]
  },
  hr: {
    chorus: "Toliko te volim",
    lines: [
      "Toliko te volim, volim naše prijateljstvo",
      "Volim i svaki dio tebe",
      "Volim tvoju kosu, tvoje mišiće, tvoj humor, tvoje vampirske zube, tvoj miris",
      "Pogotovo kad se ne tuširaš",
      "Volim kad se raznježiš i oči ti se napune suzama",
      "Volim tvoju dobrotu, tvoju sigurnost, volim kako jedeš",
      "Volim tvoja stopala, tvoje ruke, tvoj pupak, tvoj vrat",
      "Ono što najviše volim u životu je vidjeti te kako se smiješiš",
      "S onim lijepim osmijehom kad slegneš ramenima",
      "Nakriviš glavu i zatvoriš oči",
      "Ono što najviše volim u životu je tvoj osmijeh",
      "Upravo mi je palo na pamet da je ostalo samo nekoliko dana do našeg viđenja",
      "I da te napokon dodirnem i pomirišem",
      "Mislim da je to najljepše što mogu doživjeti u životu",
      "Voljeti te ovako kako te volim",
      "Volim te u vodi, u najdubljoj dubini, kod svjetionika u ponoć"
    ]
  },
  sr: {
    chorus: "Толико те волим",
    lines: [
      "Толико те волим, волим наше пријатељство",
      "Волим и сваки део тебе",
      "Волим твоју косу, твоје мишиће, твој хумор, твоје вампирске зубе, твој мирис",
      "Нарочито кад се не тушираш",
      "Волим кад се разнежиш и очи ти се напуне сузама",
      "Волим твоју доброту, твоју сигурност, волим како једеш",
      "Волим твоја стопала, твоје руке, твој пупак, твој врат",
      "Оно што највише волим у животу је да те видим како се смешиш",
      "Са оним лепим осмехом кад слегнеш раменима",
      "Накривиш главу и затвориш очи",
      "Оно што највише волим у животу је твој осмех",
      "Управо ми је пало на памет да је остало само неколико дана до нашег виђења",
      "И да те најзад додирнем и помиришем",
      "Мислим да је то најлепше што могу да доживим у животу",
      "Да те волим овако како те волим",
      "Волим те у води, у најдубљој дубини, код светионика у поноћ"
    ]
  },
  bg: {
    chorus: "Толкова те обичам",
    lines: [
      "Толкова много те обичам, обичам нашето приятелство",
      "Обичам и всяка частица от теб",
      "Обичам косата ти, мускулите ти, чувството ти за хумор, вампирските ти зъби, миризмата ти",
      "Особено когато не се къпеш",
      "Обичам, когато се трогнеш и очичките ти се пълнят със сълзи",
      "Обичам добротата ти, увереността ти, обичам как ядеш",
      "Обичам стъпалата ти, ръцете ти, пъпа ти, врата ти",
      "Това, което най-много обичам в живота, е да те виждам да се усмихваш",
      "С онази хубава усмивка, когато повдигнеш рамене",
      "Наклониш глава настрани и затвориш очички",
      "Това, което най-много обичам в живота, е усмивката ти",
      "Току-що ми хрумна, че остават само няколко дни, докато те видя",
      "И най-сетне да те докосна и да те помириша",
      "Мисля, че това е най-красивото нещо, което мога да изживея",
      "Да те обичам така, както те обичам",
      "Обичам те във водата, в най-голямата дълбочина, при фара в полунощ"
    ]
  },
  hu: {
    chorus: "Annyira szeretlek",
    lines: [
      "Annyira szeretlek, szeretem a barátságunkat",
      "Minden porcikádat szeretem",
      "Szeretem a hajad, az izmaidat, a humorodat, a vámpírfogaidat, az illatodat",
      "Főleg amikor nem fürdesz",
      "Szeretem, amikor elérzékenyülsz, és könnybe lábad a szemed",
      "Szeretem a jóságodat, a magabiztosságodat, szeretem, ahogy eszel",
      "Szeretem a lábad, a kezed, a köldököd, a nyakad",
      "Amit a legjobban szeretek az életben, az az, amikor mosolyogni látlak",
      "Azzal a szép mosollyal, amikor megvonod a vállad",
      "Oldalra billented a fejed, és lehunyod a szemed",
      "Amit a legjobban szeretek az életben, az a mosolyod",
      "Épp most jutott eszembe, hogy már csak néhány nap, és látlak",
      "És végre megérinthetlek és érezhetem az illatodat",
      "Azt hiszem, ez a legszebb dolog, amit az életben átélhetek",
      "Úgy szeretni téged, ahogy szeretlek",
      "Szeretlek a vízben, a legmélyebb mélységben, a világítótoronynál éjfélkor"
    ]
  },
  fi: {
    chorus: "Rakastan sinua niin paljon",
    lines: [
      "Rakastan sinua niin paljon, rakastan ystävyyttämme",
      "Rakastan myös jokaista osaa sinusta",
      "Rakastan hiuksiasi, lihaksiasi, huumoriasi, vampyyrinhampaitasi, tuoksuasi",
      "Varsinkin kun et ole käynyt suihkussa",
      "Rakastan, kun liikutut ja silmäsi täyttyvät kyynelistä",
      "Rakastan hyvyyttäsi, itsevarmuuttasi, rakastan tapaasi syödä",
      "Rakastan jalkojasi, käsiäsi, napaasi, kaulaasi",
      "Eniten elämässä rakastan nähdä sinun hymyilevän",
      "Sillä suloisella hymyllä, jonka teet kohauttaessasi olkapäitäsi",
      "Kallistaessasi päätäsi ja sulkiessasi silmäsi",
      "Eniten elämässä rakastan hymyäsi",
      "Juuri äsken ajattelin, että enää muutama päivä ja näen sinut",
      "Ja saan vihdoin koskettaa sinua ja tuntea tuoksusi",
      "Luulen, että se on kauneinta, mitä voin elämässä kokea",
      "Rakastaa sinua niin kuin rakastan",
      "Rakastan sinua vedessä, syvimmässä syvyydessä, majakalla keskiyöllä"
    ]
  },
  af: {
    chorus: "Ek is so lief vir jou",
    lines: [
      "Ek is so lief vir jou, ek is lief vir ons vriendskap",
      "Ek is ook lief vir elke deel van jou",
      "Ek is lief vir jou hare, jou spiere, jou humor, jou vampiertande, jou reuk",
      "Veral wanneer jy nie gestort het nie",
      "Ek is lief daarvoor wanneer jy aangedaan raak en jou ogies vol trane word",
      "Ek is lief vir jou goedheid, jou selfvertroue, ek is lief vir hoe jy eet",
      "Ek is lief vir jou voete, jou hande, jou naeltjie, jou nek",
      "Wat ek die meeste in die lewe liefhet, is om jou te sien glimlag",
      "Met daardie mooi glimlag wanneer jy jou skouers optrek",
      "En jou kop skuins hou en jou ogies toemaak",
      "Wat ek die meeste in die lewe liefhet, is jou glimlag",
      "Netnou het ek gedink dat dit net nog 'n paar dae is voor ek jou sien",
      "En jou uiteindelik kan aanraak en ruik",
      "Ek dink dit is die mooiste ding wat ek in die lewe kan ervaar",
      "Om jou lief te hê soos ek jou liefhet",
      "Ek is lief vir jou in die water, in die diepste diepte, by die vuurtoring om middernag"
    ]
  },
  hi: {
    chorus: "मुझे तुमसे बहुत प्यार है",
    lines: [
      "मुझे तुमसे बहुत प्यार है, मुझे हमारी दोस्ती से प्यार है",
      "मुझे तुम्हारे हर हिस्से से प्यार है",
      "मुझे तुम्हारे बाल, तुम्हारी मांसपेशियाँ, तुम्हारा मज़ाकिया अंदाज़, तुम्हारे पिशाच जैसे दाँत, तुम्हारी खुशबू पसंद है",
      "ख़ासकर बिना नहाए",
      "मुझे वो पल बहुत प्यारा लगता है जब भावुक होकर तुम्हारी आँखें आँसुओं से भर जाती हैं",
      "मुझे तुम्हारी अच्छाई, तुम्हारा आत्मविश्वास और तुम्हारे खाने का अंदाज़ पसंद है",
      "मुझे तुम्हारे पैर, तुम्हारे हाथ, तुम्हारी नाभि, तुम्हारी गर्दन पसंद है",
      "ज़िंदगी में मुझे सबसे ज़्यादा प्यार तुम्हें मुस्कुराते देखना है",
      "वो प्यारी मुस्कान जो कंधे उचकाने पर आती है",
      "जब सिर एक तरफ़ झुकता है और आँखें बंद हो जाती हैं",
      "ज़िंदगी में मुझे सबसे ज़्यादा प्यार तुम्हारी मुस्कान से है",
      "अभी-अभी मुझे ख़याल आया कि तुमसे मिलने में बस कुछ ही दिन बचे हैं",
      "और आख़िरकार तुम्हें छूने और तुम्हारी खुशबू महसूस करने में",
      "मुझे लगता है ज़िंदगी में इससे ख़ूबसूरत कुछ नहीं हो सकता",
      "तुमसे इस तरह प्यार करना",
      "मुझे तुमसे पानी में, सबसे गहराई में, आधी रात को लाइटहाउस पर प्यार है"
    ]
  },
  sw: {
    chorus: "Nakupenda sana",
    lines: [
      "Nakupenda sana, napenda urafiki wetu",
      "Pia napenda kila sehemu yako",
      "Napenda nywele zako, misuli yako, ucheshi wako, meno yako ya vampaya, harufu yako",
      "Hasa usipooga",
      "Napenda unapoguswa moyoni na macho yako yanajaa machozi",
      "Napenda wema wako, kujiamini kwako, napenda jinsi unavyokula",
      "Napenda miguu yako, mikono yako, kitovu chako, shingo yako",
      "Ninachopenda zaidi maishani ni kukuona ukitabasamu",
      "Kwa tabasamu lile zuri unapoinua mabega",
      "Na kuinamisha kichwa pembeni na kufumba macho",
      "Ninachopenda zaidi maishani ni tabasamu lako",
      "Sasa hivi nimewaza kwamba zimebaki siku chache tu nikuone",
      "Na hatimaye nikuguse na kukunusa",
      "Nadhani ndicho kitu kizuri zaidi ninachoweza kupitia maishani",
      "Kukupenda jinsi ninavyokupenda",
      "Nakupenda majini, katika kina kirefu zaidi, kwenye mnara wa taa usiku wa manane"
    ]
  },
  // Desde aquí: formas de hombre a hombre donde el idioma marca género.
  ar: {
    dir: "rtl",
    chorus: "أحبك كثيرًا",
    lines: [
      "أحبك كثيرًا، أحب صداقتنا",
      "وأحب أيضًا كل جزء منك",
      "أحب شعرك، عضلاتك، روح الدعابة لديك، أسنانك التي تشبه أنياب مصاص الدماء، رائحتك",
      "خصوصًا عندما لا تستحم",
      "أحب عندما تتأثر وتمتلئ عيناك بالدموع",
      "أحب طيبتك، ثقتك بنفسك، أحب طريقة أكلك",
      "أحب قدميك، يديك، سرّتك، رقبتك",
      "أكثر ما أحبه في الحياة هو أن أراك تبتسم",
      "بتلك الابتسامة الجميلة التي ترسمها عندما ترفع كتفيك",
      "وتميل رأسك جانبًا وتغمض عينيك",
      "أكثر ما أحبه في الحياة هو ابتسامتك",
      "فكرت الآن أنه لم يبقَ سوى أيام قليلة حتى أراك",
      "وأخيرًا ألمسك وأشم رائحتك",
      "أظن أنه أجمل ما يمكن أن أعيشه في الحياة",
      "أن أحبك كما أحبك",
      "أحبك في الماء، في أعمق الأعماق، عند المنارة في منتصف الليل"
    ]
  },
  he: {
    dir: "rtl",
    chorus: "אני כל כך אוהב אותך",
    lines: [
      "אני כל כך אוהב אותך, אני אוהב את החברות שלנו",
      "אני גם אוהב כל חלק בך",
      "אני אוהב את השיער שלך, את השרירים שלך, את ההומור שלך, את שיני הערפד שלך, את הריח שלך",
      "במיוחד כשאתה לא מתקלח",
      "אני אוהב כשאתה מתרגש והעיניים שלך מתמלאות בדמעות",
      "אני אוהב את טוב הלב שלך, את הביטחון שלך, אני אוהב איך שאתה אוכל",
      "אני אוהב את כפות הרגליים שלך, את הידיים שלך, את הטבור שלך, את הצוואר שלך",
      "מה שאני הכי אוהב בחיים זה לראות אותך מחייך",
      "עם החיוך היפה הזה שאתה עושה כשאתה מושך בכתפיים",
      "ומטה את הראש הצידה ועוצם את העיניים",
      "מה שאני הכי אוהב בחיים זה החיוך שלך",
      "בדיוק עכשיו חשבתי שנשארו רק כמה ימים עד שאראה אותך",
      "ושסוף סוף אגע בך ואריח אותך",
      "אני חושב שזה הדבר הכי יפה שאני יכול לחוות בחיים",
      "לאהוב אותך כמו שאני אוהב אותך",
      "אני אוהב אותך במים, במעמקים, במגדלור בחצות"
    ]
  },
  fa: {
    dir: "rtl",
    chorus: "خیلی دوستت دارم",
    lines: [
      "خیلی دوستت دارم، دوستی‌مان را دوست دارم",
      "همهٔ وجودت را هم دوست دارم",
      "موهایت، عضله‌هایت، شوخ‌طبعی‌ات، دندان‌های خون‌آشامی‌ات، بویت را دوست دارم",
      "مخصوصاً وقتی حمام نکرده‌ای",
      "دوست دارم وقتی احساساتی می‌شوی و چشم‌هایت پر از اشک می‌شود",
      "مهربانی‌ات، اعتمادبه‌نفست را دوست دارم، طرز غذا خوردنت را دوست دارم",
      "پاهایت، دست‌هایت، نافت، گردنت را دوست دارم",
      "چیزی که در زندگی بیشتر از همه دوست دارم، دیدن لبخندت است",
      "با آن لبخند قشنگی که می‌زنی وقتی شانه‌هایت را بالا می‌اندازی",
      "و سرت را کج می‌کنی و چشم‌هایت را می‌بندی",
      "چیزی که در زندگی بیشتر از همه دوست دارم، لبخند توست",
      "همین الان فکر کردم که فقط چند روز مانده تا ببینمت",
      "و بالاخره لمست کنم و بویت را حس کنم",
      "فکر می‌کنم این زیباترین چیزی است که می‌توانم در زندگی تجربه کنم",
      "دوست داشتنت آن‌طور که دوستت دارم",
      "در آب، در عمیق‌ترین جا، کنار فانوس دریایی در نیمه‌شب دوستت دارم"
    ]
  },
  ur: {
    dir: "rtl",
    chorus: "مجھے تم سے بہت محبت ہے",
    lines: [
      "مجھے تم سے بہت محبت ہے، مجھے ہماری دوستی سے محبت ہے",
      "مجھے تمہارے ہر حصے سے محبت ہے",
      "مجھے تمہارے بال، تمہارے پٹھے، تمہارا مزاح، تمہارے ویمپائر جیسے دانت، تمہاری خوشبو پسند ہے",
      "خاص طور پر جب تم نہاتے نہیں ہو",
      "مجھے اچھا لگتا ہے جب تم جذباتی ہو جاتے ہو اور تمہاری آنکھیں آنسوؤں سے بھر جاتی ہیں",
      "مجھے تمہاری نیکی، تمہارا اعتماد پسند ہے، مجھے تمہارے کھانے کا انداز پسند ہے",
      "مجھے تمہارے پاؤں، تمہارے ہاتھ، تمہاری ناف، تمہاری گردن پسند ہے",
      "زندگی میں مجھے سب سے زیادہ تمہیں مسکراتے دیکھنا پسند ہے",
      "اس پیاری مسکراہٹ کے ساتھ جب تم کندھے اچکاتے ہو",
      "اور سر ایک طرف جھکا کر آنکھیں بند کر لیتے ہو",
      "زندگی میں مجھے سب سے زیادہ تمہاری مسکراہٹ سے محبت ہے",
      "ابھی ابھی میں نے سوچا کہ تم سے ملنے میں بس چند دن باقی ہیں",
      "اور آخرکار میں تمہیں چھو سکوں گا اور تمہاری خوشبو محسوس کر سکوں گا",
      "مجھے لگتا ہے یہ زندگی کا سب سے خوبصورت تجربہ ہے",
      "تم سے ایسے محبت کرنا جیسے میں کرتا ہوں",
      "میں تم سے پانی میں، سب سے گہرائی میں، آدھی رات کو لائٹ ہاؤس پر محبت کرتا ہوں"
    ]
  },
  vi: {
    chorus: "Mình yêu cậu nhiều lắm",
    lines: [
      "Mình yêu cậu nhiều lắm, mình yêu tình bạn của chúng ta",
      "Mình cũng yêu từng phần của cậu",
      "Mình yêu tóc cậu, cơ bắp của cậu, sự hài hước của cậu, hàm răng ma cà rồng của cậu, mùi của cậu",
      "Nhất là khi cậu chưa tắm",
      "Mình yêu lúc cậu xúc động và đôi mắt rưng rưng nước mắt",
      "Mình yêu sự tốt bụng, sự tự tin của cậu, mình yêu cách cậu ăn",
      "Mình yêu đôi chân, đôi tay, cái rốn, cái cổ của cậu",
      "Điều mình yêu nhất trên đời là được thấy cậu cười",
      "Với nụ cười đáng yêu ấy khi cậu nhún vai",
      "Nghiêng đầu sang một bên và nhắm mắt lại",
      "Điều mình yêu nhất trên đời là nụ cười của cậu",
      "Vừa nãy mình nghĩ chỉ còn vài ngày nữa là được gặp cậu",
      "Và cuối cùng được chạm vào cậu và ngửi mùi của cậu",
      "Mình nghĩ đó là điều đẹp đẽ nhất mình có thể trải qua trong đời",
      "Được yêu cậu như cách mình yêu cậu",
      "Mình yêu cậu dưới nước, nơi sâu thẳm nhất, ở ngọn hải đăng lúc nửa đêm"
    ]
  },
  ms: {
    chorus: "Saya sangat cintakan awak",
    lines: [
      "Saya sangat cintakan awak, saya cintakan persahabatan kita",
      "Saya juga cintakan setiap bahagian diri awak",
      "Saya cintakan rambut awak, otot awak, jenaka awak, gigi drakula awak, bau awak",
      "Terutamanya apabila awak tidak mandi",
      "Saya suka apabila awak terharu dan mata awak bergenang air mata",
      "Saya cintakan kebaikan awak, keyakinan awak, saya suka cara awak makan",
      "Saya cintakan kaki awak, tangan awak, pusat awak, leher awak",
      "Apa yang paling saya cintai dalam hidup ialah melihat awak tersenyum",
      "Dengan senyuman manis yang awak buat apabila awak mengangkat bahu",
      "Dan memiringkan kepala lalu memejamkan mata",
      "Apa yang paling saya cintai dalam hidup ialah senyuman awak",
      "Baru tadi saya terfikir hanya tinggal beberapa hari lagi sebelum saya berjumpa awak",
      "Dan akhirnya dapat menyentuh awak dan menghidu bau awak",
      "Saya rasa itulah perkara paling indah yang boleh saya alami dalam hidup",
      "Mencintai awak seperti saya mencintai awak",
      "Saya cintakan awak di dalam air, di tempat paling dalam, di rumah api pada tengah malam"
    ]
  },
  sk: {
    chorus: "Tak veľmi ťa ľúbim",
    lines: [
      "Tak veľmi ťa ľúbim, ľúbim naše priateľstvo",
      "Ľúbim aj každú časť teba",
      "Ľúbim tvoje vlasy, tvoje svaly, tvoj humor, tvoje upírie zuby, tvoju vôňu",
      "Hlavne keď sa neosprchuješ",
      "Ľúbim, keď sa dojmeš a oči sa ti naplnia slzami",
      "Ľúbim tvoju dobrotu, tvoju istotu, ľúbim, ako ješ",
      "Ľúbim tvoje chodidlá, tvoje ruky, tvoj pupok, tvoj krk",
      "Najviac v živote ľúbim vidieť ťa usmievať sa",
      "S tým krásnym úsmevom, keď pokrčíš plecami",
      "Nakloníš hlavu nabok a zavrieš oči",
      "Najviac v živote ľúbim tvoj úsmev",
      "Práve som si pomyslel, že zostáva už len pár dní, kým ťa uvidím",
      "A konečne sa ťa dotknem a zacítim tvoju vôňu",
      "Myslím, že je to to najkrajšie, čo môžem v živote zažiť",
      "Ľúbiť ťa tak, ako ťa ľúbim",
      "Ľúbim ťa vo vode, v najväčšej hĺbke, pri majáku o polnoci"
    ]
  },
  sl: {
    chorus: "Tako zelo te ljubim",
    lines: [
      "Tako zelo te ljubim, ljubim najino prijateljstvo",
      "Ljubim tudi vsak del tebe",
      "Ljubim tvoje lase, tvoje mišice, tvoj humor, tvoje vampirske zobe, tvoj vonj",
      "Še posebej, ko se ne stuširaš",
      "Ljubim, ko se ganeš in se ti oči napolnijo s solzami",
      "Ljubim tvojo dobroto, tvojo samozavest, ljubim, kako ješ",
      "Ljubim tvoja stopala, tvoje roke, tvoj popek, tvoj vrat",
      "Kar najbolj ljubim v življenju, je videti te nasmejanega",
      "S tistim lepim nasmehom, ko skomigneš z rameni",
      "Nagneš glavo vstran in zapreš oči",
      "Kar najbolj ljubim v življenju, je tvoj nasmeh",
      "Ravnokar sem pomislil, da je do najinega snidenja le še nekaj dni",
      "In da se te končno dotaknem in te povoham",
      "Mislim, da je to najlepše, kar lahko doživim v življenju",
      "Ljubiti te tako, kot te ljubim",
      "Ljubim te v vodi, v največji globini, pri svetilniku ob polnoči"
    ]
  },
  lt: {
    chorus: "Aš tave taip myliu",
    lines: [
      "Aš tave taip myliu, myliu mūsų draugystę",
      "Myliu ir kiekvieną tavo dalelę",
      "Myliu tavo plaukus, tavo raumenis, tavo humorą, tavo vampyro dantis, tavo kvapą",
      "Ypač kai nesi nusiprausęs",
      "Myliu, kai susigraudini ir tavo akys prisipildo ašarų",
      "Myliu tavo gerumą, tavo pasitikėjimą savimi, myliu, kaip tu valgai",
      "Myliu tavo pėdas, tavo rankas, tavo bambą, tavo kaklą",
      "Labiausiai gyvenime myliu matyti tave besišypsantį",
      "Su ta gražia šypsena, kai patrauki pečiais",
      "Palenki galvą į šoną ir užmerki akis",
      "Labiausiai gyvenime myliu tavo šypseną",
      "Ką tik pagalvojau, kad liko vos kelios dienos, kol tave pamatysiu",
      "Ir pagaliau galėsiu tave paliesti ir užuosti",
      "Manau, tai gražiausia, ką galiu patirti gyvenime",
      "Mylėti tave taip, kaip tave myliu",
      "Myliu tave vandenyje, giliausioje gelmėje, prie švyturio vidurnaktį"
    ]
  },
  lv: {
    chorus: "Es tevi tik ļoti mīlu",
    lines: [
      "Es tevi tik ļoti mīlu, es mīlu mūsu draudzību",
      "Es mīlu arī katru tavu daļiņu",
      "Es mīlu tavus matus, tavus muskuļus, tavu humoru, tavus vampīra zobus, tavu smaržu",
      "Īpaši, kad tu neesi mazgājies",
      "Es mīlu, kad tu aizkusti un tavas acis piepildās ar asarām",
      "Es mīlu tavu labsirdību, tavu pašpārliecību, es mīlu to, kā tu ēd",
      "Es mīlu tavas pēdas, tavas rokas, tavu nabu, tavu kaklu",
      "Visvairāk dzīvē es mīlu redzēt tevi smaidām",
      "Ar to skaisto smaidu, kad tu parausti plecus",
      "Noliec galvu uz sāniem un aizver acis",
      "Visvairāk dzīvē es mīlu tavu smaidu",
      "Tikko iedomājos, ka līdz mūsu tikšanās reizei atlikušas tikai dažas dienas",
      "Un beidzot varēšu tev pieskarties un sajust tavu smaržu",
      "Domāju, ka tas ir skaistākais, ko varu piedzīvot dzīvē",
      "Mīlēt tevi tā, kā es tevi mīlu",
      "Es mīlu tevi ūdenī, visdziļākajā dziļumā, pie bākas pusnaktī"
    ]
  }
};

/** Devuelve el mensaje para un idioma; si no hay traducción, el original en español. */
export function getMessage(langId) {
  const translated = MESSAGES[langId] || AUTO_MESSAGES[langId];
  const msg = translated || MESSAGES.es;
  return {
    lang: translated ? langId : "es",
    translated: !!translated,
    auto: !MESSAGES[langId] && !!AUTO_MESSAGES[langId],
    dir: msg.dir || "ltr",
    lines: msg.lines.concat(Array(CHORUS_REPEATS).fill(msg.chorus))
  };
}

export const MESSAGE_LANGUAGES = Object.keys(MESSAGES).concat(Object.keys(AUTO_MESSAGES));
