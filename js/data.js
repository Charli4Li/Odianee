const ARTS_DATA = [
  {
    id: 1,
    slug: "radha-krishna",
    title: "Radha & Krishna",
    image: "assets/arts/art-1.webp",
    time: "18th Century",
    tags: ["Kangra School", "Bhakti", "Radha-Krishna", "Monsoon"],
    description: "The Kangra masters understood something that most painters have missed: that the most charged romantic moment is not the touch, but the instant before it. Here, Radha and Krishna stand beneath a monsoon sky — her eyes lowered, his smile barely contained. The forest around them mirrors their feeling: every vine curls toward every branch, every bird pairs with another. Nature conspires. The artist watches."
  },
  {
    id: 2,
    slug: "bhairavi-ragini",
    title: "Bhairavi Ragini",
    image: "assets/arts/art-2.webp",
    time: "Early Pahari",
    tags: ["Basohli School", "Ragamala", "Music", "Devotion", "Beetle-wing"],
    description: "The earliest and most electrifying of the Pahari schools, Basohli produced paintings with the intensity of a struck bell. The colours are unmixed, unafraid. The figures are architectural — bold outlines, prominent eyes, jewellery that seems almost sculptural. This Bhairavi Ragini was part of a Ragamala series — a visual meditation on musical modes and the emotions they invoke. She sits in the hour before dawn, in the mode of quiet longing, surrounded by a silence the painting somehow makes audible."
  },
  {
    id: 3,
    slug: "nala-damayanti",
    title: "Nala & Damayanti",
    image: "assets/arts/art-3.webp",
    time: "Early Pahari",
    tags: ["Guler School", "Mahabharata", "Nala-Damayanti", "Narrative", "Naturalism"],
    description: "The Guler school is where Pahari painting grew up. The bold, almost graphic intensity of Basohli gave way to something more searching — softer backgrounds, more nuanced expressions, a growing interest in landscape and atmosphere. This scene from the Nala-Damayanti story captures the instant of recognition: surrounded by identical gods, Damayanti finds the real Nala by the way he blinks, the way he sweats, the way he stands on the earth instead of hovering above it. Mortality, the painting suggests, is itself a form of grace."
  },
  {
    id: 4,
    slug: "shiva-parvati",
    title: "Shiva & Parvati",
    image: "assets/arts/art-4.webp",
    time: "18th Century",
    tags: ["Mandi School", "Shaivism", "Shiva-Parvati", "Kailash", "Cosmological"],
    description: "In the Mandi tradition, even the largest cosmic drama is rendered with an intimacy that makes the divine feel approachable. Shiva is not performing his godhood here — he is simply at home, the mountain his armchair, Parvati beside him, the universe stretching out below like a garden. The gold in this painting is not decorative. It is literal: the halo of the eternal, the shimmer at the edge of the knowable world."
  },
  {
    id: 5,
    slug: "lady-at-her-toilette",
    title: "Lady at Her Toilette",
    image: "assets/arts/art-5.webp",
    time: "Late 18th Century",
    tags: ["Kangra School", "Nayika", "Secular", "Portrait", "Femininity"],
    description: "The nayika paintings of Kangra are, in many ways, the school's most psychologically rich works. Here is a woman entirely absorbed in the art of becoming. The mirror she holds shows us her face from a second angle — we see both the act and its reflection, the woman and the image she constructs. Around her, the ordinary world: a lamp, a tray of cosmetics, a maid arranging flowers. The Kangra master renders all of this with the same attention — the human and the object equally precious, equally alive."
  },
  {
    id: 6,
    slug: "krishna-lifts-govardhan",
    title: "Krishna Lifts Govardhan",
    image: "assets/arts/art-6.webp",
    time: "Early Pahari",
    tags: ["Chamba School", "Krishna", "Govardhan", "Bhakti", "Community"],
    description: "Chamba's paintings have a warmth and golden luminosity that distinguishes them from the cooler, more linear Kangra tradition. In this celebrated scene, the child-god Krishna holds an entire mountain aloft on his little finger — and the painting somehow makes this feel not miraculous but inevitable, natural, sweet. The villagers who shelter beneath it look less frightened than comforted, as if this is exactly where they were always meant to be."
  },
  {
    id: 7,
    slug: "lovers-by-night",
    title: "Lovers by Night",
    image: "assets/arts/art-7.webp",
    time: "Early Pahari",
    tags: ["Kangra School", "Night", "Romance", "Architecture", "Silver Paint"],
    description: "The Kangra school painted night better than almost anyone in the history of Indian art. The deep blue grounds — lapis and indigo mixed and layered — gave their nocturnal scenes a depth that daylight paintings never achieved. In this intimate work, a couple shares a moonlit terrace; the river below is silver, the sky is the blue of deep water, and the pavilion is a small warm world against all that darkness. Romantic, yes. But also something more: a meditation on sanctuary."
  },
  {
    id: 8,
    slug: "durga-mahishasura",
    title: "Durga & Mahishasura",
    image: "assets/arts/art-8.webp",
    time: "Early Pahari",
    tags: ["Basohli School", "Durga", "Devi", "Mahishasura", "Shakti", "Narrative"],
    description: "The gods of Basohli are terrifying and beautiful in equal measure. This Durga — her multiple arms holding trident, sword, conch, lotus, and thunderbolt — moves through the painting like a force of nature that has taken on form simply because form was needed. The demon beneath her is detailed, almost sympathetic; his defeat is painted without cruelty. The Basohli tradition understood that the Goddess does not hate what she destroys. She simply will not allow it to continue."
  },
  {
    id: 9,
    slug: "the-hawking-prince",
    title: "The Hawking Prince",
    image: "assets/arts/art-9.webp",
    time: "Early Pahari",
    tags: ["Guler-Kangra", "Portraiture", "Royal Court", "Landscape", "Hawking"],
    description: "In the transitional moment between Guler and Kangra, Pahari painting discovered the world outside the court. Landscape appears not as backdrop but as presence — the hills have weather, the sky has distance, the river is a living thing. This prince with his hawk inhabits a real world, not just a symbolic one. The painting is a portrait, yes, but also an argument: that power in the Pahari hills was inseparable from the land it came from."
  },
  {
    id: 10,
    slug: "sawan-month-of-rain",
    title: "Sawan - Month of Rain",
    image: "assets/arts/art-10.webp",
    time: "Early Pahari",
    tags: ["Kangra School", "Baramasa", "Seasons", "Nayika", "Rain", "Longing"],
    description: "In a Baramasa series, each of the twelve months is painted as a specific emotional state, mapped onto a specific woman in a specific landscape. Sawan is the month of rain and longing. The clouds that bring relief to the earth bring only ache to the nayika, the heroine, who waits for her absent lover. Everything in this painting is calling to everything else: peacock to rain, vine to tree, woman to a horizon that offers nothing back. Kangra at its most heartbreaking. Kangra at its best."
  }
];

const HISTORY_DATA = [
  {
    id: "01",
    title: "What Is Pahari Art?",
    description: "Pahari painting is a tradition of miniature painting that flourished in the Himalayan foothills of North India, celebrating intense emotional resonance, delicate naturalism, and timeless spiritual devotion.",
    art: "assets/history/history-art-1.png"
  },
  {
    id: "02",
    title: "The Origins",
    description: "The origins of Pahari painting lie in the decline of the Mughal Empire and the migration of skilled atelier artists to the tranquil, mountain-guarded valleys of northern India.",
    art: "assets/history/history-art-2.png"
  },
  {
    id: "03",
    title: "The Schools",
    description: "Basohli, Guler, Kangra, Chamba, and Mandi each shaped unique visual languages — from vibrant unmixed pigments and beetle-wing jewel effects to soft poetic lyrical realism.",
    art: "assets/history/history-art-3.png"
  },
  {
    id: "04",
    title: "The Subjects",
    description: "Love, devotion, musical modes (Ragamala), poetry, and mythology became the living soul of Pahari art, capturing the intimate dialogue between human sentiment and cosmic beauty.",
    art: "assets/history/history-art-4.png"
  },
  {
    id: "05",
    title: "Legacy",
    description: "Today, Pahari paintings are celebrated worldwide in premier museums as enduring masterpieces of poetic storytelling, fine draughtsmanship, and transcendent aesthetic grace.",
    art: "assets/history/history-art-5.png"
  }
];

const PROCESS_DATA = [
  {
    step: "STEP 1",
    title: "The Paper and the Ground",
    text: "Most Pahari paintings were executed on wasli — a laminated sheet made by pasting several layers of paper together, then rubbing the surface smooth with a polished agate stone until it acquired a near-enamelled finish. This process, repeated many times, created a ground that was simultaneously absorbent enough to hold paint and smooth enough to accept the finest line. Some works were executed on cloth, primed with chalk and gum. A few were painted on ivory in the later period, under European influence.",
    image: "assets/process/art-1.png"
  },
  {
    step: "STEP 2",
    title: "The Pigments",
    text: "The colours of Pahari painting were not bought from a shop. They were prepared. Lapis lazuli from Afghanistan — the brilliant blue that gives Kangra night its depth — was ground by hand, washed in water to separate grades of fineness, and mixed with gum arabic in precise proportions. Vermilion came from mercury sulphide, mined and purified. White came from ground conch shell or lead carbonate. Black from lampblack, the soot of burned oil lamps, collected on copper plates. The brilliant orange-yellow of Basohli grounds came from orpiment, a naturally occurring arsenic mineral. Gold was beaten to impossible thinness and ground to a powder mixed with gum.",
    image: "assets/process/art-2.png"
  },
  {
    step: "STEP 3",
    title: "The Brushes",
    text: "The brushes of Pahari painting were almost unimaginably fine. Made from the tail hairs of squirrels, sometimes from the hairs of cat or mongoose, they were formed into points so fine that a single hair could be drawn across the surface to create a line no thicker than a human hair. The finest brushes — used for the single-hair outlines of faces, the individual lashes of a eye, the veins of a lotus petal — might contain as few as three or four hairs. To work with such tools required not just skill but a particular quality of attention: total stillness, breath control, the ability to make the hand absolutely obedient to the eye.",
    image: "assets/process/art-3.png"
  },
  {
    step: "STEP 4",
    title: "The Drawing",
    text: "The painting began with a preliminary sketch in charcoal or light red, establishing the composition. This sketch was then refined — sometimes transferred from a master drawing through the pouncing technique, in which tiny holes pricked along the outline allowed charcoal dust to mark the fresh surface. Once the composition was fixed, the drawing was gone over in ink, establishing the final outlines. Only then did colour begin.",
    image: "assets/process/art-4.png"
  },
  {
    step: "STEP 5",
    title: "The Colouring",
    text: "Colour in Pahari painting was applied in layers. The first layers were flat washes — establishing the ground of each area. Then came the modelling, with lighter and darker tones layered to create form. Then the detailing — tiny individual strokes that defined fabric texture, plant structure, architectural ornament. The process moved from large to small, from flat to complex, from ground to surface. The final stage — the outlines, the faces, the gold — was the most critical, and was often reserved for the master of the workshop while assistants handled the preparatory stages.",
    image: "assets/process/art-5.png"
  },
  {
    step: "STEP 6",
    title: "Gold and Final Details",
    text: "Gold was among the last elements applied. Mixed with gum and applied with a fine brush, it was used for jewellery, halo outlines, architectural details, border decoration, and occasionally the surface of water or the illumination of a night sky. Once dry, it was burnished — polished with an agate tool until it achieved the mirror-bright shine of real metal. Some paintings also used silver for moonlight effects, though silver tarnishes with age and most such passages have oxidised to a soft grey that carries its own beauty.",
    image: "assets/process/art-6.png"
  },
  {
    step: "STEP 7",
    title: "The Artists and Their Lives",
    text: "Most Pahari painters remain anonymous. A few names have survived — Nainsukh of Guler, perhaps the greatest individual master of the entire tradition; Manaku, his brother; Purkhu of Kangra; Khushala of Guler. But for most of the thousands of paintings that survive, we have no name, no face, no story. We have only the work.\n\nWhat we do know is that painting in the Pahari courts was a hereditary profession. The great workshops — the Seu family of Guler being the most famous — passed their knowledge through the family line, father to son, generation to generation. Children began their training young, learning to prepare materials, then to paint subsidiary elements, then progressively more complex parts of the composition. A master painter might not execute a complete painting independently until his thirties.",
    image: "assets/process/art-7.png"
  }
];
