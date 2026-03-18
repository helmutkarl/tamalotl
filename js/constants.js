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
      play: 2400,
      sleep: 4200,
      clean: 2600,
      dance: 1700,
    },

    idleDance: {
      minDelayMs: 7000,
      maxDelayMs: 14000,
    },

    actionEffects: {
      feed: {
        hunger: 24,
        happiness: 4,
        cleanliness: -6,
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
      play: "Splash splash. That was very fun.",
      sleep: "Just a soft floaty nap...",
      clean: "Fresh water wiggle. Much better.",
    },
  };
})();
