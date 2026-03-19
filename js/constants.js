(function () {
  var Tamalotl = (window.Tamalotl = window.Tamalotl || {});

  Tamalotl.CONFIG = {
    storageKey: "tamalotl-save-v1",
    tickMs: 2000,
    maxStat: 100,
    minStat: 0,
    petName: "Tamalotl",

    // Hunger acts as a "full tummy" bar in this first version.
    initialStats: {
      hunger: 78,
      happiness: 82,
      energy: 76,
      cleanliness: 88,
    },

    decayPerMinute: {
      hunger: 2.8,
      happiness: 1.6,
      energy: 2.2,
      cleanliness: 1.3,
    },

    effectDurations: {
      feed: 2200,
      pet: 1400,
      play: 2400,
      sleep: 4200,
      clean: 2600,
      dance: 1700,
    },

    idleDance: {
      minDelayMs: 7000,
      maxDelayMs: 14000,
    },

    progression: {
      baseXpForNextLevel: 18,
      xpGrowthPerLevel: 6,
      levelUpMessageMs: 5200,
      actionXp: {
        feed: 6,
        pet: 0,
        play: 9,
        sleep: 7,
        clean: 8,
      },
      unlocks: [
        {
          id: "pearl-bubbles",
          level: 2,
          title: "Pearl Bubbles",
          description: "A second bubble stream drifts through the pond.",
        },
        {
          id: "seashell-nook",
          level: 3,
          title: "Seashell Nook",
          description: "A tiny shell settles into the sand.",
        },
        {
          id: "bubble-bow",
          level: 4,
          title: "Bubble Bow",
          description: "Tamalotl gets a tiny pastel bow.",
        },
        {
          id: "dreamy-lines",
          level: 5,
          title: "Dreamy Lines",
          description: "New extra cozy mood lines appear.",
          moodMessages: {
            happy: [
              "Tamalotl is doing a teeny tiny proud wiggle.",
              "This pond feels extra magical today.",
            ],
            hungry: [
              "A dainty little snack would make this moment perfect.",
              "Tamalotl is hoping for a deluxe worm appointment.",
            ],
            sleepy: [
              "A velvet-soft nap sounds absolutely dreamy.",
              "Sleepy little frills. Sleepy little soul.",
            ],
            dirty: [
              "Could we make the pond all soft and sparkly again?",
              "Tamalotl is dreaming of fresh, glowy water.",
            ],
          },
        },
        {
          id: "starlight-sparkles",
          level: 6,
          title: "Starlight Sparkles",
          description: "Soft sparkles start twinkling in the water.",
        },
        {
          id: "heart-boops",
          level: 7,
          title: "Heart Boops",
          description: "Petting Tamalotl now releases extra hearts.",
        },
      ],
    },

    actionEffects: {
      feed: {
        hunger: 24,
        happiness: 4,
        cleanliness: -6,
      },
      pet: {
        happiness: 10,
        energy: -1,
      },
      play: {
        happiness: 18,
        hunger: -10,
        energy: -12,
        cleanliness: -5,
      },
      sleep: {
        energy: 28,
        happiness: 6,
        hunger: -8,
      },
      clean: {
        cleanliness: 30,
        happiness: 8,
        energy: -4,
      },
    },

    thresholds: {
      urgent: 35,
      low: 55,
      happy: 70,
    },

    statusLabels: {
      happy: "Feeling bubbly",
      hungry: "Snack radar on",
      sleepy: "Ready for a nap",
      dirty: "Needs fresh water",
    },

    moodMessages: {
      happy: [
        "Blub blub... what a gentle day.",
        "Everything feels soft and floaty right now.",
        "Tiny tail wiggles. Tamalotl feels very loved.",
      ],
      hungry: [
        "Tiny tummy rumble... snack, please?",
        "Tamalotl is looking at you with very hungry eyes.",
        "A little nibble would make this pond perfect.",
      ],
      sleepy: [
        "My frills feel floppy. Nap time?",
        "Tamalotl is drifting into a very sleepy wiggle.",
        "A cozy little snooze would be lovely.",
      ],
      dirty: [
        "The water feels yucky. Can we freshen it up?",
        "Tamalotl would love a clean, sparkly pond.",
        "A tiny axolotl spa moment sounds perfect.",
      ],
    },

    actionMessages: {
      feed: "Nom nom... that little worm was perfect.",
      pet: "Hehe... that made Tamalotl very happy.",
      play: "Splash splash. That was very fun.",
      sleep: "Just a soft floaty nap...",
      clean: "Fresh water wiggle. Much better.",
    },
  };
})();
