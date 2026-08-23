export const DEMO_RESTAURANTS = [
  {
    name: "Ember House",
    slug: "ember-house",
    description:
      "A fire-led contemporary dining room built around smoke, texture and seasonal ingredients. Ember House is designed as a warm, cinematic evening experience.",
    coverImageUrl: "/images/ember.svg",
    cuisine: "Contemporary European",
    location: "Gulshan 2, Dhaka",
    phone: "+880 1700 000001",
    email: "hello@ember.example",
    openingHours: "Daily · 6:00 PM – 11:30 PM",
    theme: "ember",
    isFeatured: true,
    featuredOrder: 1,
    listingOrder: 1,
    isActive: true
  },
  {
    name: "Kori",
    slug: "kori",
    description:
      "A restrained Japanese-inspired restaurant focused on precision, seasonal produce and clean presentation. Kori uses a calm, minimal dining atmosphere.",
    coverImageUrl: "/images/kori.svg",
    cuisine: "Modern Japanese",
    location: "Banani, Dhaka",
    phone: "+880 1700 000002",
    email: "hello@kori.example",
    openingHours: "Daily · 6:00 PM – 11:00 PM",
    theme: "kori",
    isFeatured: true,
    featuredOrder: 2,
    listingOrder: 2,
    isActive: true
  },
  {
    name: "Verde",
    slug: "verde",
    description:
      "A modern garden dining concept with Mediterranean flavours, fresh herbs and a lighter visual identity while retaining the platform's premium structure.",
    coverImageUrl: "/images/verde.svg",
    cuisine: "Mediterranean",
    location: "Dhanmondi, Dhaka",
    phone: "+880 1700 000003",
    email: "hello@verde.example",
    openingHours: "Daily · 5:30 PM – 11:00 PM",
    theme: "verde",
    isFeatured: true,
    featuredOrder: 3,
    listingOrder: 3,
    isActive: true
  }
];

export const DEMO_CATEGORY_SEEDS = [
  { name: "Starters", slug: "starters", displayOrder: 1 },
  { name: "Mains", slug: "mains", displayOrder: 2 },
  { name: "Desserts", slug: "desserts", displayOrder: 3 },
  { name: "Drinks", slug: "drinks", displayOrder: 4 }
];

export const DEMO_MENU_SEEDS = {
  "ember-house": [
    {
      category: "starters",
      name: "Coal-Roasted Pumpkin",
      slug: "coal-roasted-pumpkin",
      description: "Roasted pumpkin, cultured cream and smoked seed crumb.",
      ingredients: ["Pumpkin", "Cultured cream", "Seeds"],
      price: 720,
      displayOrder: 1
    },
    {
      category: "mains",
      name: "Ember Signature Plate",
      slug: "signature-main",
      description: "Fire-led seasonal protein with charred vegetables and house jus.",
      ingredients: ["Seasonal protein", "Charred vegetables", "House jus"],
      price: 1650,
      displayOrder: 1
    },
    {
      category: "desserts",
      name: "Burnt Honey Custard",
      slug: "burnt-honey-custard",
      description: "Silky custard, burnt honey and toasted grains.",
      ingredients: ["Custard", "Burnt honey", "Toasted grains"],
      price: 620,
      displayOrder: 1
    },
    {
      category: "drinks",
      name: "Smoked Citrus Fizz",
      slug: "smoked-citrus-fizz",
      description: "Citrus, smoke tea and sparkling water.",
      ingredients: ["Citrus", "Smoke tea", "Sparkling water"],
      price: 390,
      displayOrder: 1
    }
  ],
  kori: [
    {
      category: "starters",
      name: "Miso Cucumber",
      slug: "miso-cucumber",
      description: "Chilled cucumber, white miso and sesame.",
      ingredients: ["Cucumber", "White miso", "Sesame"],
      price: 560,
      displayOrder: 1
    },
    {
      category: "mains",
      name: "Kori Seasonal Main",
      slug: "signature-main",
      description: "Seasonal main inspired by Japanese restraint and clean flavours.",
      ingredients: ["Seasonal produce", "Dashi", "Rice"],
      price: 1550,
      displayOrder: 1
    },
    {
      category: "desserts",
      name: "Matcha Cloud",
      slug: "matcha-cloud",
      description: "Matcha cream, soft sponge and toasted rice.",
      ingredients: ["Matcha", "Cream", "Toasted rice"],
      price: 650,
      displayOrder: 1
    },
    {
      category: "drinks",
      name: "Yuzu Tonic",
      slug: "yuzu-tonic",
      description: "Bright yuzu, tonic and shiso aroma.",
      ingredients: ["Yuzu", "Tonic", "Shiso"],
      price: 420,
      displayOrder: 1
    }
  ],
  verde: [
    {
      category: "starters",
      name: "Herb Garden Flatbread",
      slug: "herb-garden-flatbread",
      description: "Warm flatbread, herb oil and whipped feta.",
      ingredients: ["Flatbread", "Herbs", "Feta"],
      price: 580,
      displayOrder: 1
    },
    {
      category: "mains",
      name: "Verde Garden Main",
      slug: "signature-main",
      description: "Mediterranean vegetables, grains and bright herb dressing.",
      ingredients: ["Garden vegetables", "Grains", "Fresh herbs"],
      price: 1320,
      displayOrder: 1
    },
    {
      category: "desserts",
      name: "Olive Oil Citrus Cake",
      slug: "olive-oil-citrus-cake",
      description: "Citrus cake, olive oil cream and seasonal fruit.",
      ingredients: ["Citrus", "Olive oil", "Seasonal fruit"],
      price: 590,
      displayOrder: 1
    },
    {
      category: "drinks",
      name: "Basil Lemon Cooler",
      slug: "basil-lemon-cooler",
      description: "Fresh lemon, basil and sparkling water.",
      ingredients: ["Lemon", "Basil", "Sparkling water"],
      price: 360,
      displayOrder: 1
    }
  ]
};
