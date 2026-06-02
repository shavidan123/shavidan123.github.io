(function () {
  'use strict';

  document.body.classList.add('game-page');

  // The arena is hand-styled for dark fantasy — light mode looks ass.
  // Force dark theme for the duration of this page WITHOUT touching
  // localStorage, so the user's preference is preserved on navigate-away.
  document.documentElement.setAttribute('data-theme', 'dark');

  // ============================================================
  //   STATS / CORE
  // ============================================================

  var STAT_KEYS  = ['MIGHT', 'AGI', 'VIGOR', 'WILL', 'LUCK'];
  var GATING_STATS = ['MIGHT', 'AGI', 'VIGOR', 'WILL']; // LUCK never gates
  var STAT_POOL  = 25;
  var STAT_MIN   = 1;
  var STAT_MAX   = 10;
  var GATE_THRESHOLD = 7;
  var DEFAULT_STATS = { MIGHT: 5, AGI: 5, VIGOR: 5, WILL: 5, LUCK: 5 };

  function cloneStats(s) {
    return { MIGHT: s.MIGHT, AGI: s.AGI, VIGOR: s.VIGOR, WILL: s.WILL, LUCK: s.LUCK };
  }
  function statTotal(s) { return s.MIGHT + s.AGI + s.VIGOR + s.WILL + s.LUCK; }
  function playerMaxHP(s) { return 24 + s.VIGOR * 4; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rollD(sides) { return 1 + Math.floor(Math.random() * sides); }

  // ============================================================
  //   ENEMIES — each has 5 stages, each stage is a pool of events
  // ============================================================
  //
  // Stage event shape:
  //   {
  //     telegraph: 'Boss does X.',
  //     options: [
  //       { stat: 'MIGHT', label: '...', narrate: 'failure line', right?: bool, rightNarrate?: 'success line' },
  //       ...
  //     ]
  //   }
  //
  // Exactly one option per stage event is .right=true. Others are mock failures.
  // With LUCK 10 the right narration plays regardless of choice (with a lucky tag).

  var LUCK_TAGS = [
    'Reality, faintly amused, allows this.',
    'The universe rearranges itself behind your back.',
    'Statistically, this should not have worked. Statistically.',
    'A passing pigeon does most of the heavy lifting.',
    'The d20 winks at you. The d20 should not have eyes.',
    'Cause and effect briefly hold hands.',
    'Probability files a complaint. Probability loses the complaint.',
    'You did not, technically, do that. But it happened anyway.',
    'A small god owed you a favor. It is now repaid.',
    'You roll a d20. It rolls itself, helpfully.',
    'Mathematics develops a slight LIMP in your favor.',
    'A chandelier above the boss decides today is the day.',
    'Three timelines converge. You are in the funny one.',
    'The dice goblin coughs into his fist. You take the kill anyway.',
    'You did not deserve that outcome. The outcome occurred regardless.',
    'A bard, far away, lights a cigarette. Causally related, somehow.'
  ];

  var ENEMIES = [

    // ============================================================
    //   1. VEILSTALKER SKIRMISHERS  (primary: AGI)
    // ============================================================
    {
      id: 'twins', tier: 1, name: 'Veilstalker Skirmishers',
      flavor: 'Mirrored masks. Mirrored daggers. They mirror everything — including their own mistakes.',
      hint: 'They mirror your moves. Refuse to move first.',
      hp: 80, ac: 14, atk: 5,
      dmg: { dice: 6, count: 1, bonus: 3 },
      attacks: 2,
      failDmg: { dice: 8, count: 1, bonus: 3 },
      stages: [
        // ----- Stage 1: AGI right -----
        [
          {
            telegraph: 'The twins glide into mirror stance, daggers crossed. They wait for YOU to move first.',
            options: [
              { stat: 'MIGHT', label: 'Charge them',
                narrate: 'You charge. They sidestep. Your blade lodges in a wooden post that wasn\'t there a second ago. Where did the post come from?',
                luckyNarrate: 'You charge. The mysterious post LEAPS aside — revealing itself as a small sentient elf who, for reasons beyond mortal understanding, immediately tackles twin #2. The twins are not having a good Tuesday.' },
              { stat: 'AGI', label: 'Hold absolutely still', right: true,
                rightNarrate: 'You don\'t move. They wait. They wait LONGER. One of them forgets which of them was supposed to move first. The pause stretches. You read them.' },
              { stat: 'WILL', label: 'Pray for guidance',
                narrate: 'You pray. The twins pray with you, in unison, perfect harmony. Now they know your god personally. They take notes.',
                luckyNarrate: 'You pray. Your god, in a stunning customer service moment, picks up on the FIRST ring. Specifically by dropping a small holy boulder. On twin #2. She is briefly very surprised and then less of a twin.' },
              { stat: 'VIGOR', label: 'Tense for impact',
                narrate: 'You tense. They see it. They wait for you to flinch. You wait for them. You blink first. They strike.',
                luckyNarrate: 'You tense so hard you SNEEZE. The sneeze startles one twin into stabbing the OTHER one in the foot. "That was MY foot." "I KNOW."' }
            ]
          },
          {
            telegraph: 'Both twins lower their hoods at the same moment. Their eyes are exactly level with yours. They wait.',
            options: [
              { stat: 'MIGHT', label: 'Stomp the ground',
                narrate: 'You stomp. They stomp back. The floor stomps you. You weren\'t expecting a third stomper.',
                luckyNarrate: 'You stomp. A floorboard pops up and clocks one twin under the chin. The other pauses to laugh. The pause becomes an opening. The opening becomes a wound.' },
              { stat: 'AGI', label: 'Match their stillness', right: true,
                rightNarrate: 'You lower your gaze to match theirs. Three motionless people. The room holds its breath. They lose interest first.' },
              { stat: 'WILL', label: 'Speak their names',
                narrate: 'You guess wrong twice. The twins are now insulted on each other\'s behalf.',
                luckyNarrate: 'You guess wrong — spectacularly wrong. You name them after your high school nemesis. They become so confused they break formation to discuss it. You strike during the discussion.' },
              { stat: 'VIGOR', label: 'Plant your feet wide',
                narrate: 'You plant. They plant. Everyone is planted. A nearby gardener wanders in to inspect. Now you have a witness to your forthcoming death.',
                luckyNarrate: 'You plant. A gardener arrives. The gardener is, improbably, a retired level-20 paladin. He briefly assists. He retires again. The twins are no longer formation-shaped.' }
            ]
          }
        ],
        // ----- Stage 2: AGI right -----
        [
          {
            telegraph: 'Tired of the stillness, both twins lunge in perfect synchrony. Twin daggers come for your ribs.',
            options: [
              { stat: 'MIGHT', label: 'Brute-parry both blades',
                narrate: 'You catch one. The other catches you. Pretty straightforward, really.',
                luckyNarrate: 'You catch one blade. The other STICKS in your buckler at an angle that, mathematically, redirects its owner\'s next swing back into HER OWN sister. Your buckler is now a tactical genius.' },
              { stat: 'AGI', label: 'Step BETWEEN them', right: true,
                rightNarrate: 'You slip into the gap they didn\'t think existed. Their blades carry past you. Into each other\'s gambesons. They look down. They look at each other. They look down again.' },
              { stat: 'WILL', label: 'Forbid the lunge',
                narrate: 'You forbid it. They lunge anyway. You add this to your therapist\'s pile.',
                luckyNarrate: 'You forbid it. The twins, raised with impeccable manners, briefly hesitate. The hesitation is just long enough for the floor to give out beneath them. New basement. Bad day for them.' },
              { stat: 'VIGOR', label: 'Eat both blades',
                narrate: 'You take both. They take you, in exchange. Bad trade.',
                luckyNarrate: 'You take both blades — specifically into your IRON FLASK that you forgot was clipped to your hip. The blades stick. The flask wins. Both twins are now disarmed, confused, and bleeding from the sheer rebound.' }
            ]
          },
          {
            telegraph: 'The twins blur into a crossing pattern — left-then-right-then-left-then-right.',
            options: [
              { stat: 'MIGHT', label: 'Break the pattern',
                narrate: 'You try to disrupt it. The pattern absorbs your disruption. It was always going to.',
                luckyNarrate: 'You try to break the pattern. You succeed by accidentally tripping. The trip carries you UNDER the pattern. The pattern flails trying to find you. The flailing wounds both twins.' },
              { stat: 'AGI', label: 'Time the gap', right: true,
                rightNarrate: 'You count their beats. On the third beat there is half a second of nothing. You stand inside that nothing. The blades sing past you.' },
              { stat: 'WILL', label: 'Out-stubborn the choreography',
                narrate: 'You set your jaw. The choreography sets ITS jaw. The choreography wins.',
                luckyNarrate: 'You out-stubborn the choreography. The choreography, in a fit of artistic pique, throws itself off-tempo to prove a point. The point lands on twin #1\'s shoulder. Sharp point.' },
              { stat: 'VIGOR', label: 'Charge through',
                narrate: 'You barrel forward. The pattern eats your shoulder. You\'re inside the pattern now. The pattern is unfriendly.',
                luckyNarrate: 'You charge through. You charge SO HARD you punch a hole in the pattern. One twin leaks out the side. The other is, briefly, very alone. You strike the alone one.' }
            ]
          }
        ],
        // ----- Stage 3: WILL right -----
        [
          {
            telegraph: 'Bleeding now, the twins step into shadow and FLICKER — visible, gone, visible, gone — mocking the air with quick laughs.',
            options: [
              { stat: 'MIGHT', label: 'Cleave the shadow',
                narrate: 'Your blade hits shadow. Shadow is not a substance. Your blade keeps going. So do you. Off-balance.',
                luckyNarrate: 'Your blade hits shadow. The shadow, surprised, becomes briefly substantial — just long enough to take the wound. Then it goes back to being shadow, embarrassed. Twin #1 is wounded by proxy.' },
              { stat: 'AGI', label: 'Match their flicker',
                narrate: 'You try to flicker. You are not a flicker-capable being. You stumble. The twins applaud politely from the not-real.',
                luckyNarrate: 'You try to flicker. You can\'t — but you stumble in such an unpredictable pattern that you EXACTLY MATCH where a twin chooses to materialize. Painful for both of you. More painful for her.' },
              { stat: 'WILL', label: 'Refuse to acknowledge the trick', right: true,
                rightNarrate: 'You stop looking. Your eyes simply do NOT allow it. The illusion fails because you will not engage. They flicker solid, embarrassed. You hear one of them mutter "rude."' },
              { stat: 'VIGOR', label: 'Wait it out',
                narrate: 'You wait. They flicker LONGER. You wait LONGER. They flicker into your blind spot. You no longer see them coming.',
                luckyNarrate: 'You wait. One twin flickers SO HARD she flickers herself out of existence for three seconds. When she flickers back, you happen to be standing exactly where she rematerializes. Awkward for her insides.' }
            ]
          }
        ],
        // ----- Stage 4: MIGHT right -----
        [
          {
            telegraph: 'Furious, the twins close ranks — pressing into each other\'s shadow, two bodies in one space, daggers a thicket between you.',
            options: [
              { stat: 'MIGHT', label: 'Shove them apart', right: true,
                rightNarrate: 'You shoulder into the bristling mass. Weight does what blade can\'t. The twins POP apart like reluctant magnets. One lands on her own knife. The other lands on her sister\'s elbow.' },
              { stat: 'AGI', label: 'Slip through the gap',
                narrate: 'There is no gap. They share a shadow. You hit shadow. Shadow hits back, somehow.',
                luckyNarrate: 'There is no gap. You force one anyway by slipping BETWEEN their shared shadow — which causes a small reality-tear. The reality-tear contains a single annoyed twin. She is now even more annoyed.' },
              { stat: 'WILL', label: 'Will them apart',
                narrate: 'You will it. They will it back, doubled. You feel something behind your eyes give.',
                luckyNarrate: 'You will them apart. They will them TOGETHER. Reality plays a brief game of tug-of-war and, being a poor sport, JUST CHOOSES YOU. The twins are now apart. You\'ll get the bill later.' },
              { stat: 'VIGOR', label: 'Bear-hug the cluster',
                narrate: 'You bear-hug two assassins. They are surprisingly small. They are also covered in knives.',
                luckyNarrate: 'You bear-hug them. Both blades aim for you. Both blades miss your gambeson entirely and find each other\'s twin instead. The hug was, retrospectively, optimal.' }
            ]
          }
        ],
        // ----- Stage 5: AGI right (the finisher setup) -----
        [
          {
            telegraph: 'Wounded and desperate, the twins do the unspeakable: they BREAK FORMATION. One charges. The other circles. They are, for the first time, ACTUALLY TRYING.',
            options: [
              { stat: 'MIGHT', label: 'Smash the charger',
                narrate: 'You swing for the charging twin. The circling twin slides her blade where your kidney lives. Now your kidney lives somewhere else.',
                luckyNarrate: 'You swing for the charger. The flanker, perfectly executing her flank, runs SHOULDER-FIRST into the swing she had no business being in front of. The other twin: "That was — that was MY part."' },
              { stat: 'AGI', label: 'Hold the still pose ONE MORE BEAT', right: true,
                rightNarrate: 'You don\'t move. The charging twin commits. The circling twin commits to flanking. The flank is now where the charge is going to end up.' },
              { stat: 'WILL', label: 'Outwill them',
                narrate: 'You will not be flanked. They flank you anyway. You add this to the will-doesn\'t-work pile.',
                luckyNarrate: 'You out-will them. They flank you anyway — but the flank is so PERFECTLY executed that they triangulate themselves into the same blade-arc. "Oh COME ON."' },
              { stat: 'VIGOR', label: 'Tank the charge',
                narrate: 'You tank. The charger lands. So does the flanker. You are now sandwich.',
                luckyNarrate: 'You tank. The charger bounces off you like a thrown shoe. The shoe lands on the flanker. The flanker is now also a sandwich, in her own right.' }
            ]
          }
        ]
      ],
      instakill: [
        'You don\'t move. The charger commits. The flanker arrives at the exact spot the charger will land. They figure this out approximately one second too late. The sound it makes is undignified. They die in mirror, of course. They die mirroring each other.',
        'The twins, mid-charge and mid-circle, swing on each other. Mirrored steel. Mirrored fall. You did not, technically, do anything at all. The bards will write this as if you did, of course.'
      ],
      defeatLine: [
        '"...two for one. Always. House rules."',
        '"You forgot to mirror. Sad."',
        '"We TOLD you to hold still. Twice. With our mouths."'
      ],
      bossReactWrong: [
        '"That was Page 1 of How-Not-To-Fight-Twins. We co-wrote it."',
        '"Two of us. ONE of you. Just math, friend."',
        '"You should\'ve done literally ANY other thing. Any of them."',
        '"That mistake is on the syllabus. Section: \'opening missteps.\'"',
        '"We rehearsed this. We REHEARSED. You\'re ad-libbing in our PLAY."',
        '"Both of us would like you to know: that was disappointing."',
        '"We don\'t even need to talk. We can see what you did. So can the audience."',
        '"That\'s a TWIN-tier mistake. We rate them on a scale, by the way."'
      ],
      bossReactRight: [
        '"...okay. okay that was actually clever. We hate that."',
        '"Hmm. We did not have a procedure for clever opponents."',
        '"Wait — we\'re BOTH bleeding now? Was that — was that allowed?"',
        '"That was off-script. Both scripts. Both of our scripts. Yes we have two."',
        '"The OTHER one of us was supposed to handle that."',
        '"Did you — did you SHARE A BRAIN with us for a second there?"',
        '"That move is in OUR book. How did YOU get it?"',
        '"We need to caucus. Briefly. About you."'
      ],
      bladeKill: [
        '"You... actually... ground us down. We — wow. The bards will LEAVE this part OUT."',
        '"You stabbed us. Slowly. For HOURS. That\'s — that\'s not the brand."',
        '"Death by patience. The worst kind. We hate the worst kind."'
      ]
    },

    // ============================================================
    //   2. THE HOLLOW REVENANT  (primary: WILL)
    // ============================================================
    {
      id: 'revenant', tier: 2, name: 'The Hollow Revenant',
      flavor: 'Steel passes through grief like wind through a hung sheet. Faith does not.',
      hint: 'Steel does nothing. Conviction does. Bring belief.',
      hp: 90, ac: 13, atk: 4,
      dmg: { dice: 8, count: 1, bonus: 4 },
      attacks: 1,
      failDmg: { dice: 10, count: 1, bonus: 3 },
      stages: [
        // Stage 1: WILL right
        [
          {
            telegraph: 'The Revenant drifts close, hollow eyes flickering. A wave of crushing sorrow rolls outward.',
            options: [
              { stat: 'MIGHT', label: 'Swing through the grief',
                narrate: 'Your blade passes through her ribs. She does not have ribs. Awkward.',
                luckyNarrate: 'Your blade passes through her ribs. On the way out, it picks up a single floating regret. The regret solidifies around the blade and stabs her on the way out.' },
              { stat: 'AGI', label: 'Sidestep the sorrow',
                narrate: 'You dodge feelings. Feelings find you anyway. They were always going to.',
                luckyNarrate: 'You dodge feelings. The feelings, frustrated, ricochet OFF you and back at the Revenant — who is the source. She is now haunted by her own emotions. Worse than yours.' },
              { stat: 'WILL', label: 'Refuse the sorrow', right: true,
                rightNarrate: 'You feel it. You note it. You set it down. The Revenant LOOKS at you — that is not how this is supposed to work. She is offended. Her form solidifies, just slightly.' },
              { stat: 'VIGOR', label: 'Endure it',
                narrate: 'You endure. The sorrow has a lot of inventory. You run out before it does.',
                luckyNarrate: 'You endure. You endure so HARD that the sorrow loses interest. It wanders off looking for a more responsive customer. The Revenant is now low on stock.' }
            ]
          }
        ],
        // Stage 2: WILL right
        [
          {
            telegraph: 'The Revenant whispers a name — soft, repeating, almost familiar. The whisper is trying to be YOUR name.',
            options: [
              { stat: 'MIGHT', label: 'Shout your real name back',
                narrate: 'You shout. The whisper absorbs the shout. Now the whisper sounds more like you.',
                luckyNarrate: 'You shout. Your shout disturbs a nearby sentient acorn, which falls out of a tree and plinks the Revenant on the forehead. She is briefly, profoundly bewildered.' },
              { stat: 'AGI', label: 'Mishear it deliberately',
                narrate: 'You pretend not to hear. You hear it anyway. The mishearing was wishful.',
                luckyNarrate: 'You mishear. You hear "BARRY" instead — specifically, the Revenant\'s ex-husband\'s name. She immediately gets sidetracked by 600 years of unresolved feelings. You strike during the rumination.' },
              { stat: 'WILL', label: 'Say HER true name', right: true,
                rightNarrate: 'You speak the name she had before she had hollows. She FLINCHES. The whisper breaks. For the first time in three centuries someone has remembered her correctly.' },
              { stat: 'VIGOR', label: 'Ignore it',
                narrate: 'You ignore the whisper. The whisper escalates to a SHOUT. You stop ignoring. Too late.',
                luckyNarrate: 'You ignore the whisper. The whisper, embarrassed, tries to back off and trips over its own grammar. The Revenant catches a stray syntax error in the throat.' }
            ]
          }
        ],
        // Stage 3: AGI right (the off-stat stage)
        [
          {
            telegraph: 'A spectral tendril of soul-stuff lances from her open mouth, fast as thought.',
            options: [
              { stat: 'MIGHT', label: 'Block with shield',
                narrate: 'The tendril passes through your shield like a metaphor. Which it is.',
                luckyNarrate: 'The tendril passes through your shield. The shield, displeased, materializes on the OTHER side. The tendril is now sandwiched between the shield\'s two timelines. It does not enjoy this.' },
              { stat: 'AGI', label: 'Duck under it', right: true,
                rightNarrate: 'You drop low. The tendril whistles overhead. It hits the wall, takes one disappointed look back at you, and dissipates.' },
              { stat: 'WILL', label: 'Refuse to be drained',
                narrate: 'You refuse. The tendril is not asking for permission. It rarely does.',
                luckyNarrate: 'You refuse. The tendril, raised to never accept no for an answer, throws a SPIRITUAL TANTRUM. The tantrum recoils into the Revenant. She grounds herself for a long time.' },
              { stat: 'VIGOR', label: 'Tank the drain',
                narrate: 'You take it. Several formative memories of yours go on a sudden unscheduled vacation.',
                luckyNarrate: 'You take it. The drain hits one of your really FORMATIVE memories. It is so dense the drain RICOCHETS back into the Revenant. She now has your childhood. She does not enjoy it.' }
            ]
          }
        ],
        // Stage 4: WILL right
        [
          {
            telegraph: 'Bleeding light now, the Revenant opens her chest cavity. Inside is a long, slow, terrible weeping.',
            options: [
              { stat: 'MIGHT', label: 'Strike the weeping',
                narrate: 'You can\'t strike a sound. You strike air. The weeping continues, unimpressed.',
                luckyNarrate: 'You strike the sound. The sound DUCKS — it was sentient. The weeping pauses to take notes. The pause is fatal. For the Revenant.' },
              { stat: 'AGI', label: 'Step around it',
                narrate: 'You cannot step around grief. It is shaped like a room.',
                luckyNarrate: 'You step around grief. You find a SECOND room behind it containing your unrelated emotional support kit. You apply emotional support to the Revenant. She is unfamiliar with it. It hurts.' },
              { stat: 'WILL', label: 'SMITE her with conviction', right: true,
                rightNarrate: 'You raise your blade and SAY THE THING — the prayer you mean. The blade catches light it has no business catching. The weeping flinches. Faith hits her where steel could not.' },
              { stat: 'VIGOR', label: 'Hug her',
                narrate: 'You go in for a hug. She passes through you. You hug the wall behind her. Embarrassing for everyone.',
                luckyNarrate: 'You hug. She passes through you. Behind her is a startled BARTENDER you didn\'t notice was there. The bartender, in solidarity, throws his bar towel at the Revenant. It lands.' }
            ]
          }
        ],
        // Stage 5: VIGOR right (anchor against the final drain)
        [
          {
            telegraph: 'Cornered, the Revenant opens FULLY — every hollow at once — and the drain becomes a tide pulling at you ALL.',
            options: [
              { stat: 'MIGHT', label: 'Hack the tide',
                narrate: 'You hack water. Water hacks back, somehow.',
                luckyNarrate: 'You hack the tide. The tide rises to a 3-star review. The review is so scathing the Revenant has to step out to handle it. You hit her during the customer service call.' },
              { stat: 'AGI', label: 'Outrun the pull',
                narrate: 'The pull is faster than you. The pull is faster than fast. The pull is the concept of being late for things.',
                luckyNarrate: 'You outrun the pull. You outrun it so PURELY the pull, embarrassed, goes back to retrieve something it forgot. Halfway through the retrieval it walks into the Revenant. The boss gets pulled by her own move.' },
              { stat: 'WILL', label: 'Refuse the pull',
                narrate: 'You refuse. The pull has stopped taking refusals. It is on a timer.',
                luckyNarrate: 'You refuse. The pull tries to argue. The argument is recorded by a passing scribe and immediately published as a hit play. The play has bad reviews. The Revenant takes them personally.' },
              { stat: 'VIGOR', label: 'Plant yourself like a tree', right: true,
                rightNarrate: 'You set your stance. You become FURNITURE. The tide hits you. The tide moves past you. The tide loses cohesion against your immovable body. The Revenant\'s mouth makes an O that is genuinely impressive.' }
            ]
          }
        ]
      ],
      instakill: [
        'You stand, planted. The tide breaks. The Revenant\'s many hollows collapse inward — not enough you left to drain. She unravels into a soft long wail and then nothing. Some grief stays in the room. Most of it leaves with her.',
        'She tries to drain a tree. The tree wins. Roots go all the way down.'
      ],
      defeatLine: [
        '"...join us... the queue is long..."',
        '"steel... did nothing... as it usually does..."',
        '"you forgot... to MEAN it..."'
      ],
      bossReactWrong: [
        '"...so... unwise... so... bleedable..."',
        '"steel... did NOTHING... as is its way..."',
        '"every century someone tries the wrong thing... welcome to the list..."',
        '"you forgot... to MEAN it... again..."',
        '"the queue grows longer... you have... a NUMBER... now..."',
        '"...mortals always... bring blades... to a feelings fight..."',
        '"the sorrow... eats blades... and stomachs... and timelines..."',
        '"another one... for the list... I\'m running out of... parchment..."'
      ],
      bossReactRight: [
        '"...how did you... KNOW that..."',
        '"...you read me... that\'s not... how this goes..."',
        '"that prayer... actually... arrived... at the right ADDRESS..."',
        '"...oh. ...oh. I\'m... noticing... things again..."',
        '"...don\'t. ...don\'t MEAN it again. Please."',
        '"...stop... LOOKING at me... like that..."',
        '"...you are... uncomfortably... PRESENT..."',
        '"...rude... rude with conviction... is the WORST kind..."'
      ],
      bladeKill: [
        '"...you... attritted... grief itself... how very... administrative... of you..."',
        '"...death by paperwork... I\'m... unionizing..."',
        '"...I will be... in the QUEUE... behind myself..."'
      ]
    },

    // ============================================================
    //   3. BRASS FORGEWYRM  (primary: MIGHT)
    // ============================================================
    {
      id: 'forgewyrm', tier: 3, name: 'Brass Forgewyrm',
      flavor: 'A drake plated in living foundry. Heat shimmers off her hide like the world is trying to look away.',
      hint: 'Brass turns blades. Brass does not turn ARGUMENTS made with sufficient weight.',
      hp: 110, ac: 17, atk: 6,
      dmg: { dice: 12, count: 1, bonus: 5 },
      attacks: 1,
      failDmg: { dice: 12, count: 1, bonus: 4 },
      stages: [
        // Stage 1: MIGHT right
        [
          {
            telegraph: 'The Forgewyrm coils, plating tightening. Her hide rings like a struck bell. She invites you to try.',
            options: [
              { stat: 'MIGHT', label: 'Shoulder-charge the plating', right: true,
                rightNarrate: 'You drive your full weight into the seam. The brass doesn\'t crack — but it FLEXES. Heat pours out of the crease. You\'ve opened a gap. The drake hisses, betrayed by her own armor.' },
              { stat: 'AGI', label: 'Slip a blade between the plates',
                narrate: 'The plates close around your blade. Your blade is now her blade. Hers is bigger, and on fire.',
                luckyNarrate: 'The plates close around your blade. The blade, now wedged, becomes a structural feature. The Forgewyrm tries to twist. The blade twists with her. Specifically into her own ribcage.' },
              { stat: 'WILL', label: 'Command her to soften',
                narrate: 'You command. The brass laughs. You did not know brass could laugh. Now you do.',
                luckyNarrate: 'You command. The brass laughs SO HARD it crumples a section of itself by accident. "...I did not consent to comedy structural damage," the Forgewyrm grumbles.' },
              { stat: 'VIGOR', label: 'Endure the heat',
                narrate: 'You endure. The heat endures more. Heat has been doing this longer than you.',
                luckyNarrate: 'You endure. The heat, frustrated, OVERHEATS itself. The Forgewyrm experiences a brief but humiliating internal short-circuit. A scale flies off and clatters away embarrassed.' }
            ]
          }
        ],
        // Stage 2: AGI right (the off-stat — dance under the breath)
        [
          {
            telegraph: 'The Forgewyrm inhales — chest glowing molten — and exhales a long arc of furnace breath.',
            options: [
              { stat: 'MIGHT', label: 'Bull through the fire',
                narrate: 'You charge through fire. Fire is unmoved. You are now also fire.',
                luckyNarrate: 'You bull through. You are SO MASSIVE you smother part of the breath. The unsmothered part redirects backwards into the drake\'s own face. "...how."' },
              { stat: 'AGI', label: 'Slide under the arc', right: true,
                rightNarrate: 'You hit the ground sliding. The breath roars over you, igniting the ceiling beams. You come up inside her guard, untouched, blade up. The drake squints — that was not on her itinerary.' },
              { stat: 'WILL', label: 'Refuse the burn',
                narrate: 'You refuse. The burn was never asking. It rarely asks.',
                luckyNarrate: 'You refuse the burn. The burn, taken aback, asks for clarification. While it asks, it forgets to actually burn you. The momentum carries the gout into the drake\'s own nostril.' },
              { stat: 'VIGOR', label: 'Soak the breath',
                narrate: 'You soak it. The breath was, in retrospect, more than your soak budget.',
                luckyNarrate: 'You soak. You soak SO HARD you absorb the entire gout. You then exhale at the drake. The drake is briefly stunned by being breathed at by a smaller fire.' }
            ]
          }
        ],
        // Stage 3: MIGHT right
        [
          {
            telegraph: 'A loose scale dangles from the gap you made. Underneath, you can see the meat — and the heart-furnace beating like an angry sun.',
            options: [
              { stat: 'MIGHT', label: 'Pry the scale loose with force', right: true,
                rightNarrate: 'You jam your blade in the gap and LEVER. The scale tears free with a sound like a foundry being divorced. The drake roars in a register that briefly deafens history.' },
              { stat: 'AGI', label: 'Pluck the scale delicately',
                narrate: 'You pluck. The scale holds. It is large, hot, and not interested in being plucked.',
                luckyNarrate: 'You pluck. The scale, surprised by the delicacy, FORGETS it was attached and pops off on its own. It lands on a small bug. The bug is fine. The drake is not.' },
              { stat: 'WILL', label: 'Ask the scale to leave',
                narrate: 'You ask politely. The scale is unmoved. It has tenure.',
                luckyNarrate: 'You ask politely. The scale, raised by good parents, considers the request seriously — specifically while detaching. It lands on the drake\'s foot. She makes a sound.' },
              { stat: 'VIGOR', label: 'Press your body against the gap',
                narrate: 'You press. The gap heats up. You are now searing into a drake-shape.',
                luckyNarrate: 'You press. You press so HARD the heat redirects INWARDS. The drake experiences her own furnace from the wrong side. She is shocked.' }
            ]
          }
        ],
        // Stage 4: MIGHT right
        [
          {
            telegraph: 'The heart-furnace is exposed — pulsing, defended only by a final brass collar of unimaginable density.',
            options: [
              { stat: 'MIGHT', label: 'Drive your blade THROUGH the collar', right: true,
                rightNarrate: 'You set your point. You commit your entire spine to the thrust. The collar resists for one half-second of eternity — then folds. Your blade enters the heart-furnace and asks it a hard question.' },
              { stat: 'AGI', label: 'Slip the blade past the collar',
                narrate: 'You slip. The collar slips back. The collar is, in some way, agile.',
                luckyNarrate: 'You slip past. The collar tries to slip BACK — tries TOO hard. Briefly leaves its socket. While reseating, it pinches the drake. She yelps.' },
              { stat: 'WILL', label: 'Believe through the collar',
                narrate: 'You believe. Brass does not have ears for that.',
                luckyNarrate: 'You believe. Brass develops ears, briefly, just to hear your conviction. Specifically near the heart-furnace. The ears short-circuit. Hot.' },
              { stat: 'VIGOR', label: 'Hug the heart-furnace',
                narrate: 'You hug the heart-furnace. You are briefly the heart-furnace\'s problem. You are also briefly soup.',
                luckyNarrate: 'You hug it. The hug is so EARNEST the heart-furnace experiences emotional exhaustion. Specifically it sighs. Furnaces are not built for sighing. Cracks form.' }
            ]
          }
        ],
        // Stage 5: VIGOR right (tank the death-spasm)
        [
          {
            telegraph: 'Bleeding furnace-light, the Forgewyrm convulses. Her dying spasm will level half the room — including you, unless you weather it.',
            options: [
              { stat: 'MIGHT', label: 'Punch the spasm',
                narrate: 'You punch a seizure. The seizure was bigger than your fist. Always was.',
                luckyNarrate: 'You punch the spasm. The spasm, offended at the rudeness, PAUSES to file a formal complaint. The drake collapses safely past you during the paperwork.' },
              { stat: 'AGI', label: 'Dodge the spasm',
                narrate: 'You try to dodge a dragon-shaped death rattle. There is no "outside" of a dying dragon.',
                luckyNarrate: 'You dodge. You dodge so FAR you exit the room entirely. While outside, you notice a load-bearing post. You kick it. The roof falls on the drake. Architectural homicide.' },
              { stat: 'WILL', label: 'Refuse to be flattened',
                narrate: 'You refuse flattening. The drake flattens you anyway. Her last act, lovingly.',
                luckyNarrate: 'You refuse. The drake\'s mass, sensing your refusal, RESPECTS IT. She lands beside you instead of on you. Then keeps landing. Architectural drake.' },
              { stat: 'VIGOR', label: 'Brace and ride it out', right: true,
                rightNarrate: 'You crouch low. You grip a chunk of dropped plating like a surfboard. The spasm hits — but you\'re too low, too anchored. The drake collapses. The room collapses. You stand up out of the rubble, slightly singed.' }
            ]
          }
        ]
      ],
      instakill: [
        'You ride the death-spasm out. The Forgewyrm folds into a heap of cooling brass and disappointed engineering. Somewhere, far away, a blacksmith feels a sudden chill and doesn\'t know why.',
        'The heart-furnace goes dark. The drake collapses in stages: first the head, then the wings, then her opinion of the situation.'
      ],
      defeatLine: [
        '"Hmm. Squishy. Should\'ve worn the brass too."',
        '"You came at a DRAGON with a knife. Update your build."',
        '"Note to self: humans melt at lower temperatures than expected."'
      ],
      bossReactWrong: [
        '"Hmm. Squishy. Sword-and-meat sound. Classic."',
        '"You came at a DRAGON. With THAT. I\'m almost flattered."',
        '"I am made of FOUNDRY. You are made of MISTAKES, apparently."',
        '"Tell me again, slower, how that was the plan."',
        '"My plating eats blades for breakfast. Today, also fingers."',
        '"This is page three of the dragon-fighting manual. The page is titled \'don\'t.\'"',
        '"My SCALES have warranty stickers. Yours did not."',
        '"You brought a SWORD. I brought a FOUNDRY. We are not in the same WEIGHT CLASS."'
      ],
      bossReactRight: [
        '"Ah. SHIT. That was the ONE move I didn\'t prepare for."',
        '"Brass folded. Brass NEVER folds. Brass and I are going to have a TALK."',
        '"You read the seam. I had that seam UNDER WARRANTY."',
        '"...that was, in fact, mighty. I\'ll grant you that much. Briefly."',
        '"My smith is going to be VERY embarrassed when she hears about this."',
        '"You hit me where I LIVE. I had not even told my INSURANCE I lived there."',
        '"The brass — the BRASS — folded. I just need a MOMENT."',
        '"Mighty. Capital M. With the little dragon-claw underline. Earned."'
      ],
      bladeKill: [
        '"You chipped me. To DEATH. With a STICK. I am going to be VERY embarrassed in the afterlife."',
        '"...the brass... the brass HELD... and you JUST KEPT GOING. Disrespectful."',
        '"Death by perseverance. My LEAST favorite kind. Tied with \'paperwork.\'"'
      ]
    },

    // ============================================================
    //   4. RHASA, THE CRIMSON MAW  (primary: VIGOR)
    // ============================================================
    {
      id: 'rhasa', tier: 4, name: 'Rhasa, the Crimson Maw',
      flavor: 'A void-beast with a mouth in its mouth. She lunges first, asks rhetorical questions later.',
      hint: 'Survive the bite. Find the second heart. Bring HP.',
      hp: 130, ac: 14, atk: 6,
      dmg: { dice: 10, count: 1, bonus: 6 },
      attacks: 1,
      failDmg: { dice: 12, count: 1, bonus: 6 },
      stages: [
        // Stage 1: VIGOR right (eat the opener)
        [
          {
            telegraph: 'Rhasa lunges OPENER — full maw, full speed, no warning. The bite is going to land.',
            options: [
              { stat: 'MIGHT', label: 'Punch the maw',
                narrate: 'You punch a void-mouth. The mouth eats your fist. Then the rest of you.',
                luckyNarrate: 'You punch the maw. Your fist tastes BAD — so bad the maw spits it out. With the rest of you still attached. You are catapulted to safety. Embarrassing but effective.' },
              { stat: 'AGI', label: 'Dodge the bite',
                narrate: 'You dodge. The maw was bigger than the dodge. There was no outside to dodge to.',
                luckyNarrate: 'You dodge. The maw was bigger — but your dodge was AIMED. You dodge directly into Rhasa\'s blind spot, which she didn\'t know she had. Now she does. Now her blind spot has your BLADE in it.' },
              { stat: 'WILL', label: 'Refuse the bite',
                narrate: 'You refuse. Rhasa accepts your refusal and bites you anyway.',
                luckyNarrate: 'You refuse. Rhasa appreciates the directness — so much that she pauses to congratulate you. The pause is one full second of exposed throat. You make use of it.' },
              { stat: 'VIGOR', label: 'OFFER your shield arm', right: true,
                rightNarrate: 'You shove your shield-arm into her maw. She bites it — HARD. But she bites the SHIELD, not the arm. Her jaws lock around metal she didn\'t expect. You can hear her swearing through teeth.' }
            ]
          }
        ],
        // Stage 2: WILL right (off-stat — the psychic horror)
        [
          {
            telegraph: 'Mouth full, Rhasa reaches into your skull with something thinner than thought. She wants you to FORGET why you\'re here.',
            options: [
              { stat: 'MIGHT', label: 'Headbutt the thought',
                narrate: 'You headbutt your own brain. Brain headbutts back. You are now concussed and confused.',
                luckyNarrate: 'You headbutt your own thoughts. Your thoughts give up and leave the building. The intrusion follows them, confused. Both end up in the kitchen. Rhasa\'s spectral hand is now in a kitchen drawer.' },
              { stat: 'AGI', label: 'Outpace the intrusion',
                narrate: 'You can\'t outrun something that\'s already inside.',
                luckyNarrate: 'You outrun the intrusion by running BACKWARDS into your own past. The intrusion is now reading your high school yearbook. The yearbook is so cringe Rhasa briefly disengages.' },
              { stat: 'WILL', label: 'Remember your name SO HARD it pushes her out', right: true,
                rightNarrate: 'You recite your name. Your full name. Including the embarrassing middle one. The void-mouth recoils — she didn\'t want THAT MUCH of you. You feel her tendril snap back into her like a measuring tape.' },
              { stat: 'VIGOR', label: 'Endure the forgetting',
                narrate: 'You endure. You forget what you were enduring. Then you forget everything.',
                luckyNarrate: 'You endure. You forget so thoroughly that you forget WHICH FIGHT YOU\'RE IN. Specifically you forget you should fight at all. Rhasa forgets too, in solidarity. You both reset. You strike first.' }
            ]
          }
        ],
        // Stage 3: VIGOR right
        [
          {
            telegraph: 'Rhasa hauls back, gathering for a DEVOUR — a full-body swallow attempt. The throat opens. The throat is a room.',
            options: [
              { stat: 'MIGHT', label: 'Punch your way out',
                narrate: 'You punch the inside of a throat. The throat informs you, by contracting, that this is bad form.',
                luckyNarrate: 'You punch the throat from inside. The throat, surprised, opens to complain. You ride the complaint OUT and use the momentum to stab the LARYNX. Rhasa is no longer eloquent.' },
              { stat: 'AGI', label: 'Slip out a tooth-gap',
                narrate: 'You slip. The teeth slip back into place around you. You are now lodged. Specifically lodged.',
                luckyNarrate: 'You slip the tooth-gap. The tooth pops out. You ride the tooth like a small slide. The tooth lands on Rhasa\'s other foot. Three things are now embarrassed.' },
              { stat: 'WILL', label: 'Refuse to be eaten',
                narrate: 'You refuse. The eating proceeds without your consent.',
                luckyNarrate: 'You refuse so categorically that Rhasa develops a small attack of conscience. She PAUSES mid-swallow. You strike up. From in. With prejudice.' },
              { stat: 'VIGOR', label: 'Brace inside the throat', right: true,
                rightNarrate: 'You let yourself be drawn in — and then you BRACE. Arms and legs locked against the inner walls. The throat tries to swallow. The throat fails. You can hear Rhasa\'s ribs disagreeing with each other.' }
            ]
          }
        ],
        // Stage 4: MIGHT right
        [
          {
            telegraph: 'Wedged in her throat, you can see the second heart — pulsing, slow, two ribs over from the first. It\'s glistening. You hate the word glistening but here we are.',
            options: [
              { stat: 'MIGHT', label: 'Drive your blade through both ribs', right: true,
                rightNarrate: 'You set your blade between the two heartbeats and SHOVE. Both ribs go. The blade catches the second heart on its second pulse. Rhasa makes a sound that goes through your gambeson and into the next room.' },
              { stat: 'AGI', label: 'Precision strike between the ribs',
                narrate: 'You strike between the ribs precisely. The ribs precisely shift. You hit cartilage. Cartilage shrugs.',
                luckyNarrate: 'You strike precisely. The ribs shift. You strike again, even more precisely. You shave a sliver of rib. The sliver lands in the heart valve. Cardio issues for Rhasa.' },
              { stat: 'WILL', label: 'Will the heart to stop',
                narrate: 'You will it. The heart consults its lawyer. The lawyer is also you. You lose.',
                luckyNarrate: 'You will the heart to stop. The heart, sensing peer pressure from the OTHER heart, slows. Two hearts. One peer-pressure attack. They both go down.' },
              { stat: 'VIGOR', label: 'Bear-hug the heart',
                narrate: 'You hug the heart from inside a throat. This is the worst hug ever recorded.',
                luckyNarrate: 'You hug the heart. Hugs slow heart rate. You are surprisingly knowledgeable about this. The heart slows. Then slows. Then stops, gently. The other heart panics.' }
            ]
          }
        ],
        // Stage 5: VIGOR right (ride the exit)
        [
          {
            telegraph: 'The second heart pops. Rhasa goes into a death-spiral — collapsing inward — and you\'re still inside her.',
            options: [
              { stat: 'MIGHT', label: 'Punch your way out the side',
                narrate: 'You punch a void-beast\'s flank from inside. The flank wins. The flank usually does.',
                luckyNarrate: 'You punch the flank. The flank, dying anyway, just GIVES. You punch through. You are now outside. Rhasa is in pieces. The pieces are also outside.' },
              { stat: 'AGI', label: 'Sprint out the throat',
                narrate: 'You sprint up a collapsing throat. The throat collapses. You are throat now.',
                luckyNarrate: 'You sprint up the throat. The throat tries to collapse on you. You outrun the collapse by half a second. The collapse meets only itself. Painful for the void-beast.' },
              { stat: 'WILL', label: 'Will yourself outside',
                narrate: 'You will yourself outside. The cosmos charges a fee. You can\'t pay.',
                luckyNarrate: 'You will yourself outside. The cosmos sends an invoice. You hand the invoice to Rhasa on the way out. She is now in collections.' },
              { stat: 'VIGOR', label: 'Ride the collapse to the exit', right: true,
                rightNarrate: 'You hunker down and let the convulsion CARRY you. Rhasa\'s body folds — once, twice — and spits you out her open maw like a melon pit. You roll, stand up, and dust off something you don\'t want to identify.' }
            ]
          }
        ]
      ],
      instakill: [
        'You stand outside Rhasa\'s rapidly-shrinking corpse. She folds into a final crimson knot the size of a chair. You do not sit in the chair. You will never sit in a chair again.',
        'The Crimson Maw closes a final time. From the inside, you can confirm: it tastes like REGRET.'
      ],
      defeatLine: [
        '"YUM. You taste like REGRET. My favorite seasoning."',
        '"Your second heart looks just like the first one. From in here."',
        '"I have eaten your character sheet. The character sheet has eaten you."'
      ],
      bossReactWrong: [
        '"OM NOM NOM. Tastes like REGRET. My favorite seasoning."',
        '"You attacked the MOUTH. With YOURSELF. As LUNCH."',
        '"I have eaten character sheets bigger than yours. I am still hungry."',
        '"Page 1 of my recipe book: \'will attempt to fight the mouth.\'"',
        '"Mmm. Crunchy on the OUTSIDE, embarrassed on the INSIDE."',
        '"I will be doing the DIGESTING. You will be doing the BEING DIGESTED."',
        '"You smell DELICIOUS. Specifically: like ALMOST-RIGHT."',
        '"Have you tried NOT being lunch? It\'s a popular MOVE."'
      ],
      bossReactRight: [
        '"YOU LET ME BITE YOU. ON PURPOSE. ON PURPOSE??"',
        '"That is — that is technically counterplay but I HATE it."',
        '"Where did you LEARN that. There are NO BOOKS for this."',
        '"...I see two hearts. You see two hearts. We have, regrettably, NOTICED EACH OTHER."',
        '"You are the worst meal I\'ve ever ALMOST had."',
        '"Counterplay. Counterplay from a SNACK. The audacity."',
        '"You read my BIOLOGY. That is — that is FORBIDDEN reading."',
        '"...this lunch fights BACK. I AM in fact, taken aback."'
      ],
      bladeKill: [
        '"You... whittled me. Like a CARROT. Carrots have more dignity. Carrots."',
        '"Death by a thousand cuts. Specifically yours. Specifically THAT MANY."',
        '"You poked me. To DEATH. Over hours. With a STICK. I am embarrassed for both of us."'
      ]
    },

    // ============================================================
    //   5. LORD PRAEVUS, THE LOOMED HAND  (5 stats × 5 stages — impossible without LUCK 10)
    // ============================================================
    {
      id: 'praevus', tier: 5, name: 'Lord Praevus, the Loomed Hand',
      flavor: 'He has read your character sheet. He has annotated it. He has notes.',
      hint: 'He counters MIGHT, AGI, VIGOR, AND WILL. The only stat he hasn\'t accounted for is LUCK.',
      hp: 100, ac: 15, atk: 5,
      dmg: { dice: 8, count: 1, bonus: 5 },
      attacks: 1,
      failDmg: { dice: 10, count: 1, bonus: 6 },
      stages: [
        // Stage 1: MIGHT right
        [
          {
            telegraph: 'Lord Praevus opens with the Ritual of Reading. He recites three sentences from your character sheet aloud, in your own voice.',
            options: [
              { stat: 'MIGHT', label: 'Break his concentration with brute force', right: true,
                rightNarrate: 'You drive your shoulder into his sternum. The recitation stops. He looks down at his own ribcage, mildly offended. "That was — that was on page 4. Page 4 said you would not do that."' },
              { stat: 'AGI', label: 'Sidestep the recitation',
                narrate: '"Yes. Page 3, line 9. \'The hero will sidestep.\' Anyway."',
                luckyNarrate: '"Page 3 — wait. Page 3 has been TORN OUT. Who tore out page 3. WHO." Praevus shuffles through his book. You strike during the shuffle.' },
              { stat: 'WILL', label: 'Refuse to be quoted',
                narrate: '"That refusal is on page 17. Margin note: \'predictable.\' Continuing."',
                luckyNarrate: '"That refusal is on — wait. There is a NEW page 17. Did you EDIT my notes? While I was reading them?" The editing was you. Editing is, in this case, violence.' },
              { stat: 'VIGOR', label: 'Tank the recitation',
                narrate: '"Tanking. Page 22. I have a chart for what you will do next." (He has a chart. You can see it.)',
                luckyNarrate: '"Tanking. Page 22 — the chart is BLANK. The chart was supposed to be FULL. Did the universe REDACT my chart??" While he checks the chart you wound him.' }
            ]
          }
        ],
        // Stage 2: AGI right
        [
          {
            telegraph: 'Praevus weaves a Sigil of Predicted Motion in the air. It hangs between you, glowing — a map of where you will be in three seconds.',
            options: [
              { stat: 'MIGHT', label: 'Punch the sigil',
                narrate: '"Page 9 entry: \'will attempt to punch the sigil.\' Marked complete." (He marks it complete.)',
                luckyNarrate: '"Page 9 — the entry has UPDATED ITSELF. It now reads \'will punch the sigil AND ALSO PRAEVUS.\' The second part is happening now."' },
              { stat: 'AGI', label: 'Move to a place the sigil DOESN\'T predict', right: true,
                rightNarrate: 'You watch the sigil. It shows you stepping LEFT. So you step exactly nowhere — a half-step into a position the sigil didn\'t map. The sigil flickers. Praevus FROWNS for the first time. "...that was off-script."' },
              { stat: 'WILL', label: 'Refuse the prediction',
                narrate: '"Refusal logged. Sigil unchanged. Continuing."',
                luckyNarrate: '"Refusal — wait. The sigil is now CHANGING. Why is it changing. Refusal does not change sigils. Refusal SHOULD NOT — oh." The sigil now points at him.' },
              { stat: 'VIGOR', label: 'Stand where you are',
                narrate: '"Standing-still. Page 11. Easy." (He shoves you with a word. You move.)',
                luckyNarrate: '"Standing-still. Page 11 — oh. Page 11 has been EDITED. It says \'unmoveable.\' By WHOM." The shove word slides off you. Hits Praevus.' }
            ]
          }
        ],
        // Stage 3: VIGOR right
        [
          {
            telegraph: 'Annoyed, Praevus calls down a Sigil of Unmaking — a pillar of erasure that descends slowly. It is going to land on the spot you stand.',
            options: [
              { stat: 'MIGHT', label: 'Punch the pillar',
                narrate: '"Punching the un-pillar. You would be erased twice as fast." (He is correct.)',
                luckyNarrate: '"Punching the un-pillar would erase you twice as fast — wait, your fist is GLOWING. Is that a COUNTER-pillar. Did you bring a COUNTER-PILLAR." You did. Praevus is briefly un-unmade.' },
              { stat: 'AGI', label: 'Run from the pillar',
                narrate: '"Running. Page 18. The pillar moves with you. Surely you noticed?" (You did not.)',
                luckyNarrate: '"Running. Page 18 — the pillar is running. Why is the pillar running. Oh. It\'s running AT ME."' },
              { stat: 'WILL', label: 'Refuse erasure',
                narrate: '"Refusing erasure. The erasure is unmoved by your refusal. As is the dictionary."',
                luckyNarrate: '"Refusing erasure. The erasure — pauses. The erasure CONSIDERS. The erasure finds you compelling. The erasure pivots." Bad for Praevus.' },
              { stat: 'VIGOR', label: 'Stand DIRECTLY UNDER it', right: true,
                rightNarrate: 'You step INTO the descending pillar. Praevus blinks. The Sigil of Unmaking encounters someone who refuses to be unmade. You feel the pillar HESITATE around you. It cannot decide if you should still exist. The pillar fizzles, embarrassed. "...that was — that was paradoxical."' }
            ]
          }
        ],
        // Stage 4: AGI right
        [
          {
            telegraph: 'Praevus drops his book and SPEAKS. He says the True Name of your weakness — the one you have, the one you didn\'t put on your sheet.',
            options: [
              { stat: 'MIGHT', label: 'Hit him before he finishes',
                narrate: '"Interrupting. Page 12. The name was already said. The name is in you now."',
                luckyNarrate: '"Interrupting. Page 12 — wait, page 12 is now BLANK. The name un-said itself. The name was in you and now it ISN\'T." You feel taller. Praevus is bewildered.' },
              { stat: 'AGI', label: 'Step out of your own name\'s path', right: true,
                rightNarrate: 'You twist sideways at the exact moment the word leaves his lips. The naming flies past you, lands behind you, and discovers there\'s nobody there to stick to. Praevus blinks. "...your own name has stage-fright. I did not budget for that."' },
              { stat: 'WILL', label: 'Speak HIS true name back',
                narrate: 'You don\'t have it. You make one up. "Roy?" you offer. Lord Praevus is briefly, profoundly insulted. He marks it down.',
                luckyNarrate: 'You guess "Roy." It is — somehow — correct. Lord Praevus\'s actual name is Roy. He is furious that you knew. He is also wounded by the knowing.' },
              { stat: 'VIGOR', label: 'Endure the naming',
                narrate: 'You endure your own true name. It is heavier than you remembered.',
                luckyNarrate: 'You endure your own true name. The weight settles. The weight is REASSURING. The weight TRANSFERS. To Praevus. He carries it now. He is no longer agile.' }
            ]
          }
        ],
        // Stage 5: MIGHT right (the finisher — but requires having ALSO passed all prior stages, which is impossible without all 4 stats)
        [
          {
            telegraph: 'Lord Praevus has dropped his book. He has dropped the sigil. He is now improvising. His staff comes for your head with surprising honest violence.',
            options: [
              { stat: 'MIGHT', label: 'Catch the staff and break it', right: true,
                rightNarrate: 'You catch the staff one-handed. You break it. Lord Praevus stares at the broken staff. "...it was a SIGNED staff." You have offended his bibliography.' },
              { stat: 'AGI', label: 'Dodge the swing',
                narrate: '"Page 1, line 1. Dodging." (You dodge into the staff anyway.)',
                luckyNarrate: '"Page 1 — Page 1 is GONE. The book is missing the front matter. The dodge succeeds. The staff misses." Praevus is briefly disarmed by his own missing context.' },
              { stat: 'WILL', label: 'Refuse the staff',
                narrate: '"Refusing a staff. Novel. Doesn\'t work."',
                luckyNarrate: '"Refusing a staff. Novel — the staff agrees. The staff abdicates. The staff is no longer his staff. The staff is now YOUR staff." You staff him.' },
              { stat: 'VIGOR', label: 'Tank the staff',
                narrate: '"Tanking the staff. Page 24. The staff was bigger than the page." (It was.)',
                luckyNarrate: '"Tanking — the staff bounces. The staff bounces TWICE. The second bounce lands on Praevus\'s own foot. \'That was — that was MY foot.\'"' }
            ]
          }
        ]
      ],
      instakill: [
        'Lord Praevus stands holding two halves of his signed staff. He looks at his own notes. The notes do not have a section for this. He sighs, with an academic\'s annoyance, and sits down. He does not get back up. "...you were not the build I read for."',
        'Praevus inclines his head, as if marking a passage. He is gone. Somewhere, a thread unties itself.'
      ],
      defeatLine: [
        '"You played the build. The build was wrong. I designed the menu."',
        '"You needed LUCK 10. You did not have LUCK 10. The rest is history. I\'m writing it."',
        '"I do not enjoy this. I tolerate it. The way one tolerates a sneeze."'
      ],
      bossReactWrong: [
        '"Logged. Page 14. \'Will attempt this.\' Marked complete."',
        '"My pen is heavier than your blade. I\'ll write your epitaph in cursive."',
        '"You read your sheet. I read MY sheet. I read YOURS. I read every sheet."',
        '"Predictable. The annotation reads: \'predictable.\' I underlined it."',
        '"I have an entire chapter for this. The chapter is short. The chapter is about you."',
        '"That is on the index. Under \'P\' for \'pitifully expected.\'"',
        '"The footnote on you reads: \'protagonist energy, no follow-through.\'"',
        '"You move where I have already MEASURED the floor. The floor and I conspire."'
      ],
      bossReactRight: [
        '"...that was — that was off-script."',
        '"Page 9, addendum. Footnote: \'unexpected.\' I am updating it now."',
        '"You read MY sheet. That\'s — that\'s not in the player rules."',
        '"...I will need to revise the manuscript."',
        '"You did not have this on your sheet. I checked. I CHECKED."',
        '"The errata is going to be substantial. I do not appreciate ERRATA."',
        '"You — you brought a SECOND character sheet. The HIDDEN one. Rude."',
        '"My library will be shorter by one chapter tonight. The chapter about WINNING."'
      ],
      bladeKill: [
        '"You... attritted me. With a SWORD. I had a chapter on this and I did NOT READ IT. My own fault."',
        '"...death by paperwork-resistant violence. I will be very VERY annoyed in the next life."',
        '"Mortal grit. I had a section on this. Section 7. I SKIMMED section 7."'
      ]
    }
  ];

  var ENEMY_BY_ID = {};
  ENEMIES.forEach(function (e) { ENEMY_BY_ID[e.id] = e; });

  // ============================================================
  //   GENERIC FLAVOR
  // ============================================================

  var META = [
    '[the dice goblin watches, taking notes]',
    '[the GM exhales behind the screen]',
    '[the d20 sighs audibly]',
    '[a passing scribe writes "lol" in the margin]',
    '[somewhere a character sheet sheds a single tear]',
    '[the universe consults the rulebook. the rulebook does not cover this.]',
    '[Donut, your AI companion, would not approve of this decision]',
    '[the System awards 0 XP and a single judgmental ping]',
    '[Achievement progress: "Things I Have Tried" — incremented]',
    '[the Game Master makes a face. the face is well-rehearsed.]',
    '[the dice are conferring. they have NOT reached consensus.]',
    '[somewhere in another timeline, the right choice is being made]',
    '[a hidden modifier rolls behind the screen. it is not in your favor.]',
    '[the bard sharpens their pen and waits, hopefully]',
    '[the System Message reads: "are you sure?" you click yes anyway]',
    '[the rulebook flips to a page that says "well, technically..."]',
    '[a passing god notes this for later. specifically: for a roast.]'
  ];

  var META_WIN = [
    '[the dice goblin nods. respect awarded: +1.]',
    '[the GM grins. the boss music gets the special outro.]',
    '[the universe stamps your sheet with VINDICATED in small letters.]',
    '[Achievement Unlocked: "Read The Room (literally)"]',
    '[the System awards XP. then more XP. then a thumbs-up emoji.]',
    '[somewhere, a bard is finally getting their material]',
    '[the dice bow. they had bets riding on you.]',
    '[the GM puts the boss music away. they will not need it.]',
    '[Donut, your AI companion, audibly cheers. it is concerning.]',
    '[the System messages: "well, OKAY then." it is impressed.]',
    '[a fragment of the rulebook tears itself out and applauds.]',
    '[the dice are passing a flask around. you may have invented happiness.]'
  ];

  var HERO_QUIPS = [
    '"My therapist said to commit to my choices. So."',
    '"In the name of poor planning everywhere — CHARGE."',
    '"This is fine. This is fine. This is FINE."',
    '"Let\'s see what the d20 thinks of THIS development."',
    '"Today I am a man of ACTION. Specifically: this one."',
    '"I rolled for wisdom. The wisdom told me to do this."',
    '"My character sheet has a footnote. It says \'good luck.\'"',
    '"If this works, I take credit. If not, blame the GM."',
    '"I have a +0 to Insight. I am going with my gut."',
    '"The dice goblin is on my SHOULDER and he\'s WHISPERING."',
    '"Look — I read the room. I MIGHT have read it wrong. But I READ IT."',
    '"This is what I trained for. This. Right here. Mostly."',
    '"My backstory has a chapter for this. I haven\'t read it."',
    '"I prepared three jokes for this fight. This isn\'t any of them."',
    '"Inner monologue: \'oh no.\' External monologue: this."'
  ];

  var ATTACK_LINES = [
    'You swing for the fences. Chip damage incoming.',
    'You commit to the swing. Your blade tastes the air.',
    'Steel meets boss. The boss\'s structural integrity files a small complaint.',
    'You go for a regular old hit. Sometimes regular works. Sometimes.',
    'You attack. The dice goblin perks up — finally, an honest swing.',
    'You raise your blade and ask it: "are we doing this?" The blade says yes.',
    'A simple, well-meaning slash. Steel does what steel does.',
    'You attempt a swordsmith-approved arc. The arc lands. Mostly.',
    'You ignore the puzzle and go for the throat. The throat is well-protected.',
    'Your blade and the boss have a polite, brief exchange.'
  ];

  var DEFEND_LINES = [
    'You bandage what you can. The blood-loss disagrees but cooperates.',
    'You set your stance. You exhale. Your HP exhales with you.',
    'A pause. You breathe. You decide which wound to ignore.',
    'You catch your breath. The breath was hiding.',
    'You take a knee. The knee disapproves but holds.',
    'You count to ten. The boss is, regrettably, still there at ten.',
    'You drink the questionable potion. The potion drinks you back, a little.',
    'You patch yourself up. \'Patch\' is generous. \'Acknowledge\' is more accurate.'
  ];

  var HERO_HIT_QUIPS = [
    '"I read this room CORRECTLY."',
    '"For my +0 INT modifier, this was clutch."',
    '"That\'s on page 1 of MY playbook."',
    '"Roll a will save against my SMUGNESS."',
    '"You may now ALL clap. Yes, the boss too."',
    '"Write that down. Write it DOWN."',
    '"Add that to my list of \'things I did intentionally.\'"',
    '"I rolled a nat 20 in CONFIDENCE. The wisdom is downstream."',
    '"The dice goblin and I are MUTUAL FANS now."',
    '"My character arc just GOT one."'
  ];

  var HERO_MISS_QUIPS = [
    '"...that did not pan out."',
    '"In retrospect, no."',
    '"My therapist is going to hear about this one."',
    '"Add it to the list. The long list."',
    '"I had a feeling. The feeling was WRONG."',
    '"I would like to file an objection. The objection has been DENIED."',
    '"Erase that. Erase the whole page. Erase the whole CHAPTER."',
    '"Strike that from the bardic record. STRIKE IT."',
    '"OK, so — learning moment. Mostly painful."',
    '"That was my B option. My A option was \'don\'t fight a god.\'"'
  ];

  var VICTORY = [
    'Victory.',
    'The fight is yours.',
    'You stand. They do not.',
    'You wipe your blade clean.'
  ];

  var DEFEAT = [
    'You fall. The dust receives you politely.',
    'Defeat. The world goes dim.',
    'You don\'t get back up.',
    'The character sheet falls beside you. Neither of you moves.'
  ];

  // ============================================================
  //   PIXEL PORTRAITS
  // ============================================================

  var PALETTE = {
    '.': null,
    'K': '#0a0907', 'k': '#1A1612',
    'W': '#FFFFFF', 'L': '#D0D5DE',
    'S': '#A8B0BC', 's': '#5C6470',
    'i': '#F2E5C0',
    'Y': '#E2A84B', 'y': '#8B6914',
    'E': '#FFE85C', 'F': '#FFFCE0',
    'R': '#A82A2A', 'r': '#5A1818',
    'P': '#5E2F8A', 'p': '#3A1B5C', 'M': '#1A0D2E',
    'D': '#2A2832', 'd': '#15141A',
    'G': '#5C5970', 'g': '#3D3A4A',
    'C': '#A82828', 'c': '#5A1410',
    'I': '#FFD800',
    'B': '#7A4C28', 'b': '#3D2614', 'O': '#D88A3E',
    'V': '#6E5C8C', 'v': '#2E2542'
  };

  var PORTRAITS = {
    hero: [
      '......WWWW......',
      '......WLLW......',
      '....sSSSSSSs....',
      '...sSSSSSSSSs...',
      '...sSsKKKKsSs...',
      '...sSEKKKKESs...',
      '...sSSSSSSSSs...',
      '...sSSYYYYSSs...',
      '...sSSSSSSSSs...',
      '....RRRRRRRR....',
      '...RYYRRRRYYR...',
      '...RRYYYYYYRR...',
      '...RRRRRRRRRR...',
      '....ssssssss....',
      '................',
      '................'
    ],
    twins: [
      '...WWWW..WWWW...',
      '..WWWWWWWWWWWW..',
      '..WKKWKKKKWKKW..',
      '..WKWWKKKKWWKW..',
      '..WWWWKKKKWWWW..',
      '..WW.KKKKKK.WW..',
      '..WWKKKKKKKKWW..',
      '..WWWWWWWWWWWW..',
      '...sSSsssssSSs..',
      '...SLSSSSSSLS...',
      '...SS.S..S.SS...',
      '....SS....SS....',
      '....SS....SS....',
      '....ss....ss....',
      '................',
      '................'
    ],
    // Revenant redesigned: pale skull + dark cowl + tattered hem.
    // Distinct from Praevus (purple void) by being light/skeletal.
    revenant: [
      '................',
      '....kKKKKKKKk...',
      '...kKLLLLLLLLk..',
      '..kKLLLLLLLLLLk.',
      '..kKLKKLLLLKKLKk',
      '..kKLKEKLLKEKLKk',
      '..kKLKKLLLLKKLKk',
      '..kKLLLLLLLLLLKk',
      '..kKLLLKKKKLLLKk',
      '..kKLLKLLLLKLLKk',
      '..kKKLLLLLLLLKKk',
      '...kKKLLLLLLKKk.',
      '....kKKKKKKKKk..',
      '..kKK.KK.KK.KKk.',
      '..k.k.k.k.k.k.k.',
      '................'
    ],
    forgewyrm: [
      '....BBBBBBBB....',
      '...BBOOOOOOBB...',
      '..BBOOOOOOOOBB..',
      '..BOOBBOOBBOOB..',
      '..BOIIBOOBIIOB..',
      '..BOOBBOOBBOOB..',
      '..BOOOOOOOOOOB..',
      '..BBBKKKKKKBBB..',
      '...BIIIIIIIIB...',
      '...BIWIWIWIWIB..',
      '...BIIIIIIIIIB..',
      '..BBOOOOOOOOOBB.',
      '...BBOOOOOOOOB..',
      '....BBBBBBBBB...',
      '................',
      '................'
    ],
    rhasa: [
      '...DDDDDDDDDD...',
      '..DDGGGGGGGGDD..',
      '..DGGGGGGGGGGD..',
      '..DGgKgggggKgD..',
      '..DGCKCgggCKCD..',
      '..DGggCCCCggGD..',
      '..DGGIWIIWIWGD..',
      '..DGCIIIIIIIIcd.',
      '..DGCCIIIIIICcd.',
      '..DGgCCIIIICggd.',
      '..DDgggCCCgggdd.',
      '...DDDgggggDDD..',
      '....cccccccc....',
      '................',
      '................',
      '................'
    ],
    praevus: [
      '......dddd....Y.',
      '....ddVVVVdd..Y.',
      '...dVVVVVVVVd.Y.',
      '..dVVVKKKKVVVdK.',
      '..dVKVEKKEVKVdK.',
      '..dVKKKKKKKKVdK.',
      '..dVVKKKKKKVVdK.',
      '..dVVVVKKVVVVdK.',
      '..dVVVVVVVVVVdK.',
      '..dvVvVvVvVvVdK.',
      '..dvYVvVvVvYvdK.',
      '..ddvvVvVvvvddK.',
      '...dddvvvvdddK..',
      '....dddddddd.K..',
      '.............K..',
      '................'
    ]
  };

  function renderPortrait(id) {
    var rows = PORTRAITS[id];
    if (!rows) return '';
    var parts = ['<svg viewBox="0 0 16 16" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">',
      '<g class="portrait-root portrait-' + id + '">'];
    for (var y = 0; y < 16; y++) {
      var row = rows[y] || '';
      var x = 0;
      while (x < row.length) {
        var ch = row.charAt(x);
        if (!PALETTE[ch]) { x++; continue; }
        var xs = x;
        while (x < row.length && row.charAt(x) === ch) x++;
        parts.push('<rect x="' + xs + '" y="' + y +
          '" width="' + (x - xs) + '" height="1" fill="' + PALETTE[ch] + '"/>');
      }
    }
    parts.push('</g></svg>');
    return parts.join('');
  }

  // ============================================================
  //   STATE
  // ============================================================

  var state = {
    screen: 'roster',
    selectedEnemyId: null,
    stats: cloneStats(DEFAULT_STATS),
    defeated: {},
    lastResult: null
  };

  // ============================================================
  //   STYLES
  // ============================================================

  var styles = ''
    + 'body.game-page .d20-widget{display:none !important}'
    + 'body.game-page #theme-toggle{display:none !important}'
    + 'body.game-page{background:#1a1612;color:#E8D6B4;'
    + 'font-family:"Courier New",monospace;min-height:100vh}'
    + 'body.game-page #main{max-width:none;padding:0;margin:0}'
    + 'body.game-page .splash{max-width:none}'
    + 'body.game-page .page__footer{display:none}'
    + 'body.game-page .masthead{border-bottom-color:#3D3733}'

    + '.arena-root{min-height:calc(100vh - 80px);'
    + 'display:flex;flex-direction:column;align-items:center;'
    + 'padding:32px 16px 56px;box-sizing:border-box;image-rendering:pixelated}'
    + '.arena-back{font-size:10px;letter-spacing:1.5px;text-transform:lowercase;'
    + 'opacity:.6;margin-bottom:14px;align-self:flex-start;width:100%;'
    + 'max-width:1040px;padding:0 4px}'
    + '.arena-back a{color:#C9966A;text-decoration:none;'
    + 'border-bottom:1px dotted rgba(201,150,106,.4);padding-bottom:1px}'
    + '.arena-back a:hover{color:#E2A84B;border-bottom-color:#E2A84B}'
    + '.arena-title{font-size:14px;letter-spacing:6px;text-transform:uppercase;'
    + 'color:#E2A84B;opacity:.85;margin:0 0 6px;text-align:center;font-weight:700}'
    + '.arena-sub{font-size:10px;letter-spacing:2.5px;opacity:.45;'
    + 'text-align:center;margin:0 0 32px;text-transform:lowercase}'
    + '.arena-screen{width:100%;max-width:1040px}'

    // Roster
    + '.roster-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}'
    + '.roster-card{background:#231F1C;border:1px solid #3D3733;border-radius:3px;'
    + 'padding:16px 14px;display:flex;flex-direction:column;align-items:center;gap:8px;'
    + 'cursor:pointer;transition:border-color .15s ease,transform .15s ease,background .15s ease}'
    + '.roster-card:hover{border-color:#E2A84B;transform:translateY(-2px);background:#2A2522}'
    + '.roster-card.defeated{border-color:#7ABC78}'
    + '.roster-portrait{width:96px;height:96px;background:#1a1612;border:1px solid #3D3733;'
    + 'display:flex;align-items:center;justify-content:center;overflow:hidden;'
    + 'image-rendering:pixelated}'
    + '.roster-portrait svg{width:100%;height:100%;display:block;image-rendering:pixelated}'
    + '.roster-name{font-size:11px;letter-spacing:2px;color:#E2A84B;text-transform:uppercase;'
    + 'margin-top:2px;text-align:center}'
    + '.roster-tier{font-size:8px;letter-spacing:2px;opacity:.45;text-transform:uppercase}'
    + '.roster-flavor{font-size:10px;line-height:1.5;opacity:.65;text-align:center;min-height:48px}'
    + '.roster-status{font-size:9px;letter-spacing:2px;text-transform:uppercase;'
    + 'margin-top:2px;font-weight:700}'
    + '.roster-status.go{color:#E2A84B}'
    + '.roster-status.defeated{color:#7ABC78}'

    // Allocator
    + '.alloc-wrap{display:flex;flex-direction:column;align-items:center;gap:18px}'
    + '.alloc-header{display:flex;align-items:center;gap:14px;padding:14px 18px;'
    + 'background:#231F1C;border:1px solid #3D3733;border-radius:3px;'
    + 'min-width:320px;max-width:600px}'
    + '.alloc-header .roster-portrait{width:64px;height:64px}'
    + '.alloc-header-text{flex:1}'
    + '.alloc-header-name{font-size:13px;letter-spacing:3px;text-transform:uppercase;'
    + 'color:#E2A84B;margin:0 0 4px}'
    + '.alloc-header-flavor{font-size:10px;opacity:.7;line-height:1.5;margin:0}'
    + '.alloc-header-hint{font-size:10px;color:#C9966A;font-style:italic;'
    + 'line-height:1.5;margin:6px 0 0}'
    + '.alloc-grid{display:grid;grid-template-columns:1fr;gap:10px;'
    + 'background:#231F1C;border:1px solid #3D3733;border-radius:3px;'
    + 'padding:18px 22px;min-width:340px;max-width:520px;width:100%}'
    + '.alloc-row{display:grid;grid-template-columns:80px 1fr 80px;align-items:center;gap:10px}'
    + '.alloc-label{font-size:11px;letter-spacing:2px;color:#E2A84B;text-transform:uppercase}'
    + '.alloc-controls{display:flex;align-items:center;justify-content:center;gap:10px}'
    + '.alloc-btn{background:#1a1612;color:#E2A84B;border:1px solid #3D3733;'
    + 'width:28px;height:28px;font-family:"Courier New",monospace;font-size:14px;'
    + 'font-weight:700;cursor:pointer;border-radius:2px;transition:all .12s ease}'
    + '.alloc-btn:hover:not(:disabled){background:#E2A84B;color:#1a1612;border-color:#E2A84B}'
    + '.alloc-btn:disabled{opacity:.3;cursor:not-allowed}'
    + '.alloc-value{font-size:18px;font-weight:700;color:#E8D6B4;min-width:24px;text-align:center}'
    + '.alloc-value.gated{color:#7ABC78}'
    + '.alloc-bar{position:relative;height:6px;background:#1a1612;border:1px solid #3D3733;'
    + 'border-radius:2px;overflow:hidden}'
    + '.alloc-bar-fill{position:absolute;left:0;top:0;bottom:0;background:#E2A84B;'
    + 'transition:width .15s ease}'
    + '.alloc-bar-fill.gated{background:#7ABC78}'
    + '.alloc-bar-marker{position:absolute;top:-2px;bottom:-2px;width:2px;'
    + 'background:#7ABC78;opacity:.7;pointer-events:none}'
    + '.alloc-footer{display:flex;justify-content:space-between;align-items:center;'
    + 'gap:12px;padding:10px 16px;background:#231F1C;border:1px solid #3D3733;'
    + 'border-radius:3px;min-width:340px;max-width:520px;width:100%}'
    + '.alloc-remaining{font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.7}'
    + '.alloc-remaining b{color:#E2A84B;font-size:14px;margin:0 4px}'
    + '.alloc-buttons{display:flex;gap:12px}'

    // Buttons
    + '.btn{background:#1a1612;color:#E2A84B;border:1px solid #3D3733;'
    + 'padding:10px 22px;font-family:"Courier New",monospace;font-size:11px;'
    + 'font-weight:700;letter-spacing:3px;text-transform:uppercase;'
    + 'cursor:pointer;border-radius:2px;transition:all .15s ease}'
    + '.btn:hover:not(:disabled){background:#E2A84B;color:#1a1612;border-color:#E2A84B}'
    + '.btn.primary{background:#E2A84B;color:#1a1612;border-color:#E2A84B}'
    + '.btn.primary:hover{background:#F5C26B;border-color:#F5C26B}'
    + '.btn.ghost{background:transparent;color:#888;border-color:#3D3733}'
    + '.btn.ghost:hover{color:#E8D6B4;border-color:#5C544E;background:#231F1C}'
    + '.btn:disabled{opacity:.35;cursor:not-allowed}'

    // Combat layout
    + '.combat-wrap{display:grid;grid-template-columns:1fr 320px;gap:14px;align-items:start}'
    + '.combat-main{display:flex;flex-direction:column;gap:14px}'

    // Fighter panels
    + '.fighter-panel{background:#231F1C;border:1px solid #3D3733;border-radius:3px;'
    + 'padding:14px 16px;display:grid;grid-template-columns:80px 1fr;gap:14px;'
    + 'align-items:center;position:relative;min-height:96px}'
    + '.fighter-panel.boss{border-left:3px solid #E74C3C}'
    + '.fighter-panel.hero{border-left:3px solid #7ABC78}'
    + '.fighter-panel.hero.lucky-aura{border-left-color:#FFD24A;'
    + 'box-shadow:0 0 12px rgba(255,210,74,.35),inset 0 0 18px rgba(255,210,74,.08)}'
    + '.fighter-portrait{width:80px;height:80px;background:#0E0C0A;'
    + 'border:1px solid #3D3733;display:block;image-rendering:pixelated;overflow:hidden}'
    + '.fighter-portrait svg{width:100%;height:100%;display:block;image-rendering:pixelated}'
    + '.fighter-info{display:flex;flex-direction:column;gap:4px;min-width:0}'
    + '.fighter-name{font-size:13px;letter-spacing:2.5px;color:#E2A84B;'
    + 'text-transform:uppercase;font-weight:700;margin:0}'
    + '.fighter-flavor{font-size:10px;opacity:.65;font-style:italic;margin:0;line-height:1.45}'

    // Speech bubble
    + '.speech-bubble{position:absolute;background:#2A2522;border:1px solid #5C544E;'
    + 'border-radius:6px;padding:10px 12px;font-size:11px;line-height:1.5;'
    + 'color:#E8D6B4;letter-spacing:.5px;opacity:0;transition:opacity .25s ease,transform .25s ease;'
    + 'pointer-events:none;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,.4);max-width:480px}'
    + '.speech-bubble.show{opacity:1}'
    + '.fighter-panel.boss .speech-bubble{top:calc(100% + 6px);left:14px;right:14px;'
    + 'transform:translateY(-6px)}'
    + '.fighter-panel.boss .speech-bubble.show{transform:translateY(0)}'
    + '.fighter-panel.boss .speech-bubble::after{content:"";position:absolute;left:32px;'
    + 'bottom:100%;border:7px solid transparent;border-bottom-color:#5C544E}'
    + '.fighter-panel.boss .speech-bubble::before{content:"";position:absolute;left:33px;'
    + 'bottom:100%;border:6px solid transparent;border-bottom-color:#2A2522;'
    + 'transform:translateY(1px);z-index:1}'
    + '.fighter-panel.hero .speech-bubble{bottom:calc(100% + 6px);left:14px;right:14px;'
    + 'transform:translateY(6px)}'
    + '.fighter-panel.hero .speech-bubble.show{transform:translateY(0)}'
    + '.fighter-panel.hero .speech-bubble::after{content:"";position:absolute;left:32px;'
    + 'top:100%;border:7px solid transparent;border-top-color:#5C544E}'
    + '.fighter-panel.hero .speech-bubble::before{content:"";position:absolute;left:33px;'
    + 'top:100%;border:6px solid transparent;border-top-color:#2A2522;'
    + 'transform:translateY(-1px);z-index:1}'

    // HP bar
    + '.hp-bar{width:100%;height:8px;background:#1a1612;border:1px solid #3D3733;'
    + 'border-radius:1px;overflow:hidden;margin-top:2px}'
    + '.hp-fill{height:100%;background:#7ABC78;transition:width .35s ease}'
    + '.hp-fill.low{background:#E2A84B}.hp-fill.crit{background:#E74C3C}'
    + '.hp-fill.boss{background:#E74C3C}'
    + '.hp-text{font-size:9px;opacity:.6;letter-spacing:1px;margin-top:1px}'

    // Stat row
    + '.stat-row{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:6px}'
    + '.stat-cell{display:flex;flex-direction:column;align-items:flex-start;gap:2px}'
    + '.stat-label{font-size:8px;letter-spacing:1.5px;opacity:.55;text-transform:uppercase}'
    + '.stat-bar{display:flex;gap:1px;align-items:center}'
    + '.stat-tick{display:inline-block;width:5px;height:8px;background:#0E0C0A;'
    + 'border:1px solid #3D3733;border-radius:1px}'
    + '.stat-tick.on{background:#E2A84B;border-color:#8B6914}'
    + '.stat-tick.on.gated{background:#7ABC78;border-color:#3D6D38}'
    + '.stat-tick.on.max{background:#FFD24A;box-shadow:0 0 2px rgba(255,210,74,.6)}'
    + '.stat-value{font-size:10px;font-weight:700;color:#E2A84B;letter-spacing:1px;margin-top:1px}'
    + '.stat-value.gated{color:#7ABC78}'

    // Stage telegraph
    + '.stage-telegraph{background:#231F1C;border:1px solid #3D3733;border-radius:3px;'
    + 'padding:14px 16px;min-height:60px;display:flex;flex-direction:column;gap:6px}'
    + '.stage-progress{display:flex;gap:6px;align-items:center;'
    + 'font-size:9px;letter-spacing:2px;opacity:.7;text-transform:uppercase}'
    + '.stage-progress .pip{width:10px;height:10px;border:1px solid #3D3733;'
    + 'background:#0E0C0A;border-radius:50%}'
    + '.stage-progress .pip.done{background:#E2A84B;border-color:#8B6914}'
    + '.stage-progress .pip.current{background:#FFD24A;border-color:#FFD24A;'
    + 'box-shadow:0 0 6px rgba(255,210,74,.5)}'
    + '.stage-telegraph-text{font-size:12px;line-height:1.6;color:#E8D6B4;font-style:italic}'

    // Options grid
    + '.options-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}'
    + '.option-btn{background:#1a1612;color:#E8D6B4;border:1px solid #3D3733;'
    + 'padding:12px 14px;text-align:left;font-family:"Courier New",monospace;'
    + 'cursor:pointer;border-radius:2px;transition:all .15s ease;'
    + 'display:flex;flex-direction:column;gap:4px;position:relative}'
    + '.option-btn:hover:not(:disabled){background:#2A2522;border-color:#E2A84B}'
    + '.option-btn:disabled{opacity:.35;cursor:not-allowed}'
    + '.option-btn .opt-stat{font-size:9px;letter-spacing:2px;color:#7ABC78;'
    + 'text-transform:uppercase;font-weight:700}'
    + '.option-btn:disabled .opt-stat{color:#888}'
    + '.option-btn .opt-label{font-size:12px;letter-spacing:1px;color:#E8D6B4}'
    + '.option-btn.lucky:not(:disabled) .opt-stat{color:#FFD24A}'
    + '.option-btn.lucky:not(:disabled){border-color:#FFD24A;'
    + 'box-shadow:0 0 8px rgba(255,210,74,.18) inset}'

    // Emergency actions row
    + '.emerg-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}'

    // Arena center
    + '#arena-stage{position:relative;width:100%;height:64px;'
    + 'background:linear-gradient(to bottom,#0E0C0A 0%,#1a1612 100%);'
    + 'border:1px solid #3D3733;border-radius:3px;overflow:visible}'
    + '.damage-floater{position:absolute;font-family:"Courier New",monospace;'
    + 'font-size:22px;font-weight:900;letter-spacing:1px;pointer-events:none;'
    + 'left:50%;color:#FFFFFF;'
    + 'text-shadow:2px 2px 0 #000,-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000;'
    + 'animation:dmg-rise 1.4s ease-out forwards;z-index:5;white-space:nowrap}'
    + '.damage-floater.crit{font-size:30px;color:#FFD24A}'
    + '.damage-floater.heal{color:#7ABC78}'
    + '.damage-floater.lucky{color:#FFD24A;font-size:16px}'
    + '@keyframes dmg-rise{'
    + '0%{transform:translate(-50%,12px) scale(.5);opacity:0}'
    + '14%{transform:translate(-50%,-8px) scale(1.25);opacity:1}'
    + '28%{transform:translate(-50%,-18px) scale(1);opacity:1}'
    + '70%{transform:translate(-50%,-32px);opacity:1}'
    + '100%{transform:translate(-50%,-52px);opacity:0}}'
    + '#dice-flash{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);'
    + 'pointer-events:none;text-align:center;opacity:0;z-index:4}'
    + '#dice-flash.show{animation:dice-flash 1.0s ease-out forwards}'
    + '.dice-flash-num{font-family:"Courier New",monospace;font-size:36px;font-weight:900;'
    + 'color:#E2A84B;letter-spacing:2px;'
    + 'text-shadow:0 0 8px rgba(226,168,75,.9),2px 2px 0 #000,-2px 2px 0 #000,2px -2px 0 #000,-2px -2px 0 #000}'
    + '.dice-flash-label{font-family:"Courier New",monospace;font-size:9px;'
    + 'letter-spacing:2.5px;color:#E2A84B;opacity:.7;text-transform:uppercase;margin-top:2px}'
    + '@keyframes dice-flash{'
    + '0%{transform:translate(-50%,-50%) scale(2.4) rotate(-20deg);opacity:0}'
    + '15%{transform:translate(-50%,-50%) scale(1);opacity:1}'
    + '70%{transform:translate(-50%,-50%) scale(1);opacity:1}'
    + '100%{transform:translate(-50%,-50%) scale(.6) rotate(15deg);opacity:0}}'

    // Combat log
    + '.combat-log{background:#231F1C;border:1px solid #3D3733;padding:14px;'
    + 'border-radius:3px;height:560px;overflow-y:auto;display:flex;'
    + 'flex-direction:column;gap:5px;font-size:10px;line-height:1.55}'
    + '.combat-log::-webkit-scrollbar{width:6px}'
    + '.combat-log::-webkit-scrollbar-track{background:#1a1612}'
    + '.combat-log::-webkit-scrollbar-thumb{background:#3D3733;border-radius:2px}'
    + '.log-line.you{color:#E8D6B4}'
    + '.log-line.foe{color:#C9A088}'
    + '.log-line.hit{color:#E2A84B}'
    + '.log-line.crit{color:#FFD24A;font-weight:700}'
    + '.log-line.miss{opacity:.45;font-style:italic}'
    + '.log-line.lucky{color:#FFD24A;font-weight:700}'
    + '.log-line.right{color:#7ABC78;font-weight:700}'
    + '.log-line.wrong{color:#E74C3C}'
    + '.log-line.meta{color:#5C8C8C;font-style:italic;opacity:.75}'
    + '.log-line.victory{color:#7ABC78;font-weight:700;letter-spacing:2px;'
    + 'text-transform:uppercase;margin-top:6px}'
    + '.log-line.defeat{color:#E74C3C;font-weight:700;letter-spacing:2px;'
    + 'text-transform:uppercase;margin-top:6px}'
    + '.log-divider{height:1px;background:#3D3733;margin:6px 0;opacity:.5}'

    // Result
    + '.result-wrap{display:flex;flex-direction:column;align-items:center;'
    + 'gap:20px;padding:24px;background:#231F1C;border:1px solid #3D3733;'
    + 'border-radius:3px;max-width:540px;margin:0 auto;text-align:center}'
    + '.result-banner{font-size:32px;letter-spacing:8px;font-weight:900;'
    + 'text-transform:uppercase;margin:0}'
    + '.result-banner.win{color:#7ABC78}'
    + '.result-banner.lose{color:#E74C3C}'
    + '.result-info{font-size:11px;opacity:.7;line-height:1.6;letter-spacing:1px}'

    + '@media (max-width:820px){'
    + '.combat-wrap{grid-template-columns:1fr}'
    + '.combat-log{height:280px}'
    + '.options-grid{grid-template-columns:1fr}'
    + '}'
    + '@media (max-width:520px){'
    + '.roster-grid{grid-template-columns:repeat(2,1fr)}'
    + '.fighter-panel{grid-template-columns:64px 1fr}'
    + '.fighter-portrait{width:64px;height:64px}'
    + '}';

  var styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ============================================================
  //   RENDER DISPATCH
  // ============================================================

  function $(id) { return document.getElementById(id); }

  function render() {
    var el = $('arena-screen');
    if (!el) return;
    el.innerHTML = '';
    if (state.screen === 'roster')   renderRoster(el);
    else if (state.screen === 'allocate') renderAllocator(el);
    else if (state.screen === 'combat')   renderCombat(el);
    else if (state.screen === 'result')   renderResult(el);
  }

  // ----- Roster ---------------------------------------------------------

  function renderRoster(el) {
    var grid = document.createElement('div');
    grid.className = 'roster-grid';
    ENEMIES.forEach(function (e) { grid.appendChild(buildRosterCard(e)); });
    el.appendChild(grid);
  }

  function buildRosterCard(enemy) {
    var card = document.createElement('div');
    var defeated = !!state.defeated[enemy.id];
    card.className = 'roster-card' + (defeated ? ' defeated' : '');

    var portrait = document.createElement('div');
    portrait.className = 'roster-portrait';
    portrait.innerHTML = renderPortrait(enemy.id);

    var tier = document.createElement('div');
    tier.className = 'roster-tier';
    tier.textContent = 'tier ' + enemy.tier;

    var name = document.createElement('div');
    name.className = 'roster-name';
    name.textContent = enemy.name;

    var flav = document.createElement('div');
    flav.className = 'roster-flavor';
    flav.textContent = enemy.flavor;

    var status = document.createElement('div');
    status.className = 'roster-status';
    if (defeated) { status.classList.add('defeated'); status.textContent = 'defeated ✓'; }
    else { status.classList.add('go'); status.textContent = 'challenge'; }

    card.appendChild(portrait);
    card.appendChild(tier);
    card.appendChild(name);
    card.appendChild(flav);
    card.appendChild(status);
    card.addEventListener('click', function () { onSelectEnemy(enemy.id); });
    return card;
  }

  function onSelectEnemy(enemyId) {
    state.selectedEnemyId = enemyId;
    state.stats = cloneStats(DEFAULT_STATS);
    state.screen = 'allocate';
    render();
  }

  // ----- Allocator ------------------------------------------------------

  function renderAllocator(el) {
    var enemy = ENEMY_BY_ID[state.selectedEnemyId];
    var wrap = document.createElement('div');
    wrap.className = 'alloc-wrap';

    var header = document.createElement('div');
    header.className = 'alloc-header';
    var hp = document.createElement('div');
    hp.className = 'roster-portrait';
    hp.innerHTML = renderPortrait(enemy.id);
    var ht = document.createElement('div');
    ht.className = 'alloc-header-text';
    ht.innerHTML =
      '<div class="alloc-header-name">' + enemy.name + '</div>' +
      '<div class="alloc-header-flavor">' + enemy.flavor + '</div>' +
      '<div class="alloc-header-hint">' + enemy.hint + '</div>' +
      '<div class="alloc-header-hint" style="opacity:.55">Each option in combat needs ' +
        'its stat at <b>' + GATE_THRESHOLD + '+</b> to be selectable. LUCK never gates ' +
        '(but LUCK 10 unlocks everything).</div>';
    header.appendChild(hp);
    header.appendChild(ht);
    wrap.appendChild(header);

    var grid = document.createElement('div');
    grid.className = 'alloc-grid';
    STAT_KEYS.forEach(function (k) { grid.appendChild(buildAllocRow(k)); });
    wrap.appendChild(grid);

    var footer = document.createElement('div');
    footer.className = 'alloc-footer';
    var remaining = document.createElement('div');
    remaining.className = 'alloc-remaining';
    remaining.id = 'alloc-remaining';
    var buttons = document.createElement('div');
    buttons.className = 'alloc-buttons';
    var back = document.createElement('button');
    back.className = 'btn ghost';
    back.textContent = '← back';
    back.addEventListener('click', backToRoster);
    var fight = document.createElement('button');
    fight.className = 'btn primary';
    fight.textContent = 'begin fight';
    fight.addEventListener('click', startCombat);
    buttons.appendChild(back);
    buttons.appendChild(fight);
    footer.appendChild(remaining);
    footer.appendChild(buttons);
    wrap.appendChild(footer);

    el.appendChild(wrap);
    refreshAllocator();
  }

  function buildAllocRow(key) {
    var row = document.createElement('div');
    row.className = 'alloc-row';
    var label = document.createElement('div');
    label.className = 'alloc-label';
    label.textContent = key;

    var controls = document.createElement('div');
    controls.className = 'alloc-controls';
    var minus = document.createElement('button');
    minus.className = 'alloc-btn';
    minus.textContent = '−';
    minus.dataset.stat = key; minus.dataset.dir = '-1';
    minus.addEventListener('click', onAllocClick);
    var val = document.createElement('div');
    val.className = 'alloc-value';
    val.id = 'alloc-val-' + key;
    val.textContent = state.stats[key];
    var plus = document.createElement('button');
    plus.className = 'alloc-btn';
    plus.textContent = '+';
    plus.dataset.stat = key; plus.dataset.dir = '1';
    plus.addEventListener('click', onAllocClick);
    controls.appendChild(minus);
    controls.appendChild(val);
    controls.appendChild(plus);

    var barWrap = document.createElement('div');
    barWrap.className = 'alloc-bar';
    var fill = document.createElement('div');
    fill.className = 'alloc-bar-fill';
    fill.id = 'alloc-bar-' + key;
    fill.style.width = (state.stats[key] / STAT_MAX * 100) + '%';
    barWrap.appendChild(fill);
    // Show gating threshold marker on gating stats only
    if (GATING_STATS.indexOf(key) >= 0) {
      var marker = document.createElement('div');
      marker.className = 'alloc-bar-marker';
      marker.style.left = (GATE_THRESHOLD / STAT_MAX * 100) + '%';
      marker.title = 'Threshold: ' + GATE_THRESHOLD;
      barWrap.appendChild(marker);
    }

    row.appendChild(label);
    row.appendChild(barWrap);
    row.appendChild(controls);
    return row;
  }

  function onAllocClick(ev) {
    var key = ev.currentTarget.dataset.stat;
    var dir = parseInt(ev.currentTarget.dataset.dir, 10);
    var next = state.stats[key] + dir;
    if (next < STAT_MIN || next > STAT_MAX) return;
    var newTotal = statTotal(state.stats) - state.stats[key] + next;
    if (newTotal > STAT_POOL) return;
    state.stats[key] = next;
    refreshAllocator();
  }

  function refreshAllocator() {
    var total = statTotal(state.stats);
    var remaining = STAT_POOL - total;
    var remEl = $('alloc-remaining');
    if (remEl) {
      remEl.innerHTML = 'points remaining <b>' + remaining + '</b> / ' + STAT_POOL;
    }
    STAT_KEYS.forEach(function (k) {
      var v = $('alloc-val-' + k);
      var gated = (GATING_STATS.indexOf(k) >= 0) && state.stats[k] >= GATE_THRESHOLD;
      if (v) {
        v.textContent = state.stats[k];
        v.classList.toggle('gated', gated);
      }
      var bar = $('alloc-bar-' + k);
      if (bar) {
        bar.style.width = (state.stats[k] / STAT_MAX * 100) + '%';
        bar.classList.toggle('gated', gated);
      }
    });
  }

  function backToRoster() {
    state.selectedEnemyId = null;
    state.screen = 'roster';
    render();
  }

  // ============================================================
  //   COMBAT (Henry Stickmin mode)
  // ============================================================

  function startCombat() {
    var enemyT = ENEMY_BY_ID[state.selectedEnemyId];
    state.combat = {
      enemyId: enemyT.id,
      enemyName: enemyT.name,
      enemy: { hp: enemyT.hp, maxHp: enemyT.hp },
      player: {
        hp: playerMaxHP(state.stats),
        maxHp: playerMaxHP(state.stats),
        stats: cloneStats(state.stats)
      },
      stageIdx: 0,
      correctStages: 0,    // perfect run = 5; gates the instakill cinematic
      bladePhase: false,   // post-puzzle: only ATTACK / DEFEND remain
      currentEvent: null,
      turn: 'player',
      turnCount: 0,
      log: [],
      busy: false,
      finished: false
    };
    rollNextEvent();
    state.screen = 'combat';
    render();
    logLine('A ' + enemyT.name + ' rises before you.', 'foe');
    logLine(enemyT.hint, 'meta');
    pushLogDivider();
  }

  function rollNextEvent() {
    var c = state.combat;
    var enemy = ENEMY_BY_ID[c.enemyId];
    var pool = enemy.stages[c.stageIdx];
    c.currentEvent = pick(pool);
  }

  function renderCombat(el) {
    var c = state.combat;
    var enemy = ENEMY_BY_ID[c.enemyId];

    var wrap = document.createElement('div');
    wrap.className = 'combat-wrap';

    var main = document.createElement('div');
    main.className = 'combat-main';

    // Boss panel
    var boss = document.createElement('div');
    boss.className = 'fighter-panel boss';
    boss.innerHTML =
      '<div class="fighter-portrait">' + renderPortrait(enemy.id) + '</div>' +
      '<div class="fighter-info">' +
        '<div class="fighter-name">' + enemy.name + '</div>' +
        '<div class="fighter-flavor">' + enemy.flavor + '</div>' +
        '<div class="hp-bar"><div class="hp-fill boss" id="hp-fill-boss"></div></div>' +
        '<div class="hp-text" id="hp-text-boss">' + c.enemy.hp + ' / ' + c.enemy.maxHp + ' HP</div>' +
      '</div>' +
      '<div class="speech-bubble" id="boss-bubble"></div>';
    main.appendChild(boss);

    // Stage telegraph
    var stage = document.createElement('div');
    stage.className = 'stage-telegraph';
    stage.id = 'stage-telegraph';
    main.appendChild(stage);

    // Arena stage (small — for dice + floaters)
    var arena = document.createElement('div');
    arena.id = 'arena-stage';
    arena.innerHTML = '<div id="dice-flash"></div>';
    main.appendChild(arena);

    // Options grid
    var opts = document.createElement('div');
    opts.className = 'options-grid';
    opts.id = 'options-grid';
    main.appendChild(opts);

    // Emergency row
    var emerg = document.createElement('div');
    emerg.className = 'emerg-row';
    emerg.id = 'emerg-row';
    main.appendChild(emerg);

    // Hero panel
    var hero = document.createElement('div');
    hero.className = 'fighter-panel hero';
    if (c.player.stats.LUCK === 10) hero.classList.add('lucky-aura');
    hero.innerHTML =
      '<div class="fighter-portrait">' + renderPortrait('hero') + '</div>' +
      '<div class="fighter-info">' +
        '<div class="fighter-name">The Hero</div>' +
        '<div class="hp-bar"><div class="hp-fill" id="hp-fill-player"></div></div>' +
        '<div class="hp-text" id="hp-text-player">' + c.player.hp + ' / ' + c.player.maxHp + ' HP</div>' +
        renderStatRow(c.player.stats) +
      '</div>' +
      '<div class="speech-bubble" id="hero-bubble"></div>';
    main.appendChild(hero);

    wrap.appendChild(main);

    // Right column: log
    var log = document.createElement('div');
    log.className = 'combat-log';
    log.id = 'combat-log';
    wrap.appendChild(log);

    el.appendChild(wrap);

    paintStage();
    updateHPBars();
    repaintLog();
  }

  function renderStatRow(s) {
    return '<div class="stat-row">' +
      STAT_KEYS.map(function (k) {
        var v = s[k];
        var gated = (GATING_STATS.indexOf(k) >= 0) && v >= GATE_THRESHOLD;
        var blocks = '';
        for (var i = 1; i <= 10; i++) {
          blocks += '<span class="stat-tick' + (i <= v ? ' on' : '') +
                    (gated ? ' gated' : '') +
                    (v === 10 ? ' max' : '') + '"></span>';
        }
        return '<div class="stat-cell"><div class="stat-label">' + k +
               '</div><div class="stat-bar">' + blocks +
               '</div><div class="stat-value' + (gated ? ' gated' : '') +
               '">' + v + '</div></div>';
      }).join('') + '</div>';
  }

  function paintStage() {
    var c = state.combat;
    if (!c || c.finished) return;
    var enemy = ENEMY_BY_ID[c.enemyId];
    var ev = c.currentEvent;
    var luckMax = c.player.stats.LUCK === 10;
    var blade = !!c.bladePhase;

    // Telegraph block — switches to blade-phase message after puzzle done
    var stageEl = $('stage-telegraph');
    if (stageEl) {
      if (blade) {
        stageEl.innerHTML =
          '<div class="stage-progress">puzzle complete · ' + c.correctStages +
            ' / ' + enemy.stages.length + ' correct</div>' +
          '<div class="stage-telegraph-text">The elegant kill is off the table. ' +
            'Only your blade finishes them now — ATTACK until they fall.</div>';
      } else {
        var pips = '';
        for (var i = 0; i < enemy.stages.length; i++) {
          var klass = i < c.stageIdx ? 'done' : (i === c.stageIdx ? 'current' : '');
          pips += '<span class="pip ' + klass + '"></span>';
        }
        stageEl.innerHTML =
          '<div class="stage-progress">stage ' + (c.stageIdx + 1) + ' / ' + enemy.stages.length +
            ' · correct so far: ' + c.correctStages +
            '<span style="display:inline-flex;gap:4px;margin-left:8px">' + pips + '</span></div>' +
          '<div class="stage-telegraph-text">' + ev.telegraph + '</div>';
      }
    }

    // Options grid — hidden in blade phase
    var optsEl = $('options-grid');
    if (optsEl) {
      optsEl.innerHTML = '';
      if (!blade) {
        ev.options.forEach(function (opt, idx) {
          var b = document.createElement('button');
          b.className = 'option-btn' + (luckMax ? ' lucky' : '');
          var gated = (c.player.stats[opt.stat] >= GATE_THRESHOLD);
          var unlocked = luckMax || gated;
          b.disabled = !unlocked || c.busy;
          b.innerHTML =
            '<div class="opt-stat">' + opt.stat + ' ' + GATE_THRESHOLD + '+' +
              (gated ? ' ✓' : (luckMax ? ' ★' : ' ✗')) + '</div>' +
            '<div class="opt-label">' + opt.label + '</div>';
          b.addEventListener('click', function () { onOptionClick(idx); });
          optsEl.appendChild(b);
        });
      }
    }

    // Emergency buttons — ATTACK and DEFEND. Both consume a turn (boss hits back).
    var emergEl = $('emerg-row');
    if (emergEl) {
      emergEl.innerHTML = '';
      var attackBtn = document.createElement('button');
      attackBtn.className = 'btn' + (blade ? ' primary' : '');
      attackBtn.textContent = '⚔ ATTACK' + (blade ? '  (finish them)' : '  (chip · slow)');
      attackBtn.disabled = c.busy;
      attackBtn.addEventListener('click', onAttack);
      var defendBtn = document.createElement('button');
      defendBtn.className = 'btn ghost';
      defendBtn.textContent = '▢ DEFEND  (heal · halve boss hit)';
      defendBtn.disabled = c.busy;
      defendBtn.addEventListener('click', onDefend);
      emergEl.appendChild(attackBtn);
      emergEl.appendChild(defendBtn);
    }
  }

  // ----- Helpers ---------------------------------------------------------

  function logLine(text, cls) {
    if (!state.combat) return;
    state.combat.log.push({ text: text, cls: cls || '' });
    var line = document.createElement('div');
    line.className = 'log-line ' + (cls || '');
    line.textContent = text;
    var logEl = $('combat-log');
    if (logEl) { logEl.appendChild(line); logEl.scrollTop = logEl.scrollHeight; }
  }
  function pushLogDivider() {
    if (!state.combat) return;
    state.combat.log.push({ divider: true });
    var logEl = $('combat-log');
    if (logEl) {
      var d = document.createElement('div');
      d.className = 'log-divider';
      logEl.appendChild(d);
      logEl.scrollTop = logEl.scrollHeight;
    }
  }
  function repaintLog() {
    var logEl = $('combat-log');
    if (!logEl) return;
    logEl.innerHTML = '';
    state.combat.log.forEach(function (entry) {
      if (entry.divider) {
        var d = document.createElement('div');
        d.className = 'log-divider';
        logEl.appendChild(d);
      } else {
        var line = document.createElement('div');
        line.className = 'log-line ' + (entry.cls || '');
        line.textContent = entry.text;
        logEl.appendChild(line);
      }
    });
    logEl.scrollTop = logEl.scrollHeight;
  }
  function updateHPBars() {
    var c = state.combat; if (!c) return;
    var pFill = $('hp-fill-player');
    var pTxt = $('hp-text-player');
    if (pFill) {
      var pPct = Math.max(0, c.player.hp / c.player.maxHp) * 100;
      pFill.style.width = pPct + '%';
      pFill.className = 'hp-fill' + (pPct < 25 ? ' crit' : (pPct < 55 ? ' low' : ''));
    }
    if (pTxt) pTxt.textContent = Math.max(0, c.player.hp) + ' / ' + c.player.maxHp + ' HP';

    var eFill = $('hp-fill-boss');
    var eTxt = $('hp-text-boss');
    if (eFill) {
      var ePct = Math.max(0, c.enemy.hp / c.enemy.maxHp) * 100;
      eFill.style.width = ePct + '%';
    }
    if (eTxt) eTxt.textContent = Math.max(0, c.enemy.hp) + ' / ' + c.enemy.maxHp + ' HP';
  }
  function showBubble(side, text, duration) {
    var el = $(side + '-bubble');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    var ms = (typeof duration === 'number') ? duration : 3600;
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () { el.classList.remove('show'); }, ms);
  }
  function flashDice(value, label) {
    var el = $('dice-flash');
    if (!el) return;
    el.innerHTML = '<div class="dice-flash-num">' + value + '</div>' +
                   '<div class="dice-flash-label">' + (label || 'd20') + '</div>';
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }
  function spawnFloater(text, cls) {
    var stage = $('arena-stage');
    if (!stage) return;
    var f = document.createElement('div');
    f.className = 'damage-floater ' + (cls || '');
    f.textContent = text;
    f.style.top = '50%';
    stage.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1500);
  }
  function setBusy(b) {
    var c = state.combat;
    if (!c) return;
    c.busy = b;
    paintStage();
  }

  // ----- Option click ----------------------------------------------------

  function onOptionClick(idx) {
    var c = state.combat;
    if (!c || c.finished || c.busy) return;
    var ev = c.currentEvent;
    var opt = ev.options[idx];
    var enemy = ENEMY_BY_ID[c.enemyId];
    var luckMax = c.player.stats.LUCK === 10;

    var unlocked = luckMax || (c.player.stats[opt.stat] >= GATE_THRESHOLD);
    if (!unlocked) return;

    setBusy(true);
    c.turnCount += 1;

    // ----- Phase 1: hero commits (bubble + log) -----
    var heroQuip = pick(HERO_QUIPS);
    showBubble('hero', heroQuip + ' "' + opt.label + '."', 3000);
    logLine(heroQuip, 'you');
    logLine('— you commit to "' + opt.label + '"', 'you');

    var isRight = !!opt.right;

    // LUCK chance to save a wrong pick. LUCK/10 chance, LUCK 10 = guaranteed.
    // Right picks always succeed normally — luck doesn't reroute correct play.
    var luckChance = c.player.stats.LUCK / 10;
    var luckSaves = !isRight && (luckMax || Math.random() < luckChance);

    if (luckSaves) return playLuckOption(opt, ev, enemy);

    // ----- Phase 2: dice -----
    setTimeout(function () {
      flashDice(rollD(20), isRight ? 'd20 ✓' : 'd20');
    }, 700);

    // ----- Phase 3: narrate (chat log) -----
    setTimeout(function () {
      logLine(isRight ? (opt.rightNarrate || 'You succeed.') : (opt.narrate || 'It does not work.'),
              isRight ? 'right' : 'wrong');
    }, 1500);

    // ----- Phase 4: boss reacts (bubble + log) -----
    setTimeout(function () {
      var bossLine = pick(isRight ? enemy.bossReactRight : enemy.bossReactWrong);
      showBubble('boss', bossLine, 4400);
      logLine('— BOSS: ' + bossLine, 'foe');
      if (Math.random() < 0.45) {
        setTimeout(function () { logLine(pick(META), 'meta'); }, 700);
      }
    }, 2400);

    // ----- Phase 5: hero quip back (bubble) -----
    setTimeout(function () {
      var heroBack = pick(isRight ? HERO_HIT_QUIPS : HERO_MISS_QUIPS);
      showBubble('hero', heroBack, 3000);
      logLine(heroBack, 'you');
    }, 3600);

    // ----- Phase 6: resolve -----
    setTimeout(function () {
      if (isRight) {
        spawnFloater('STAGE ' + (c.stageIdx + 1) + ' ✓', 'heal');
        advanceStage(false);
      } else {
        bossPunishAndAdvance();
      }
    }, 4600);
  }

  // Generic fallbacks used when an option doesn't define a custom luckyNarrate.
  // Each takes the option label and weaves it into a "yet it worked" line.
  var LUCK_FALLBACK_SAVES = [
    'And yet — somehow — the boss is the one bleeding.',
    'A passing chandelier picks this exact moment to fall. On the boss.',
    'It should not have worked. It did. The boss is wounded. The math is unspoken.',
    'Reality folds, very slightly, in your favor. The boss has a new wound.',
    'A passing pigeon dies dramatically on the boss. You take the credit.',
    'You did not, technically, hit the boss. But the boss IS hit. So.',
    'Cosmic intervention. The boss is wounded. No one knows how.',
    'You committed to the bit so hard fate had to play along. The boss is hit.',
    'Improbability theorem #4: sometimes flukes carry the day. This is one of those.',
    'Statistically, you whiffed. The boss did not get the memo.'
  ];

  function makeFallbackLucky(opt) {
    return 'You ' + opt.label.toLowerCase() + '. ' + pick(LUCK_FALLBACK_SAVES);
  }

  function playLuckOption(opt, ev, enemy) {
    var luckyOutcome = opt.luckyNarrate || makeFallbackLucky(opt);
    var luckTag = pick(LUCK_TAGS);

    setTimeout(function () { flashDice(20, 'd20 ★'); }, 700);

    setTimeout(function () {
      logLine(luckyOutcome, 'lucky');
    }, 1500);

    setTimeout(function () {
      logLine('[LUCKY] ' + luckTag, 'lucky');
    }, 2300);

    setTimeout(function () {
      var bossLine = pick(enemy.bossReactRight);
      showBubble('boss', bossLine, 4400);
      logLine('— BOSS: ' + bossLine, 'foe');
      spawnFloater('LUCKY!', 'lucky');
    }, 3100);

    setTimeout(function () {
      var heroBack = pick(HERO_HIT_QUIPS);
      showBubble('hero', heroBack, 3000);
      logLine(heroBack, 'you');
    }, 4000);

    setTimeout(function () { advanceStage(true); }, 5000);
  }

  // Called after a SUCCESSFUL stage pick. Damages boss, increments perfect-run
  // counter, advances stageIdx. If we just finished stage 5: instakill if all
  // 5 were right (the chunk damage is skipped — instakill subsumes it),
  // otherwise drop into blade phase (chunk applies).
  function advanceStage(viaLuck) {
    var c = state.combat;
    var enemy = ENEMY_BY_ID[c.enemyId];

    setTimeout(function () {
      c.correctStages += 1;
      var nextStageIdx = c.stageIdx + 1;
      var puzzleDone = nextStageIdx >= enemy.stages.length;
      var perfectRun = puzzleDone && c.correctStages === enemy.stages.length;

      // Skip the chunk on the final stage of a perfect run — the instakill
      // cinematic will take the rest of the boss's HP in one fell swoop.
      if (!perfectRun) {
        var chunk = Math.floor(c.enemy.maxHp / (enemy.stages.length + 1));
        c.enemy.hp = Math.max(0, c.enemy.hp - chunk);
        updateHPBars();
        logLine('You take ' + chunk + ' off the boss.', 'hit');
        spawnFloater('-' + chunk, 'crit');
      }

      c.stageIdx = nextStageIdx;
      if (puzzleDone) {
        if (perfectRun) return triggerInstakill();
        return enterBladePhase();
      }
      pushLogDivider();
      logLine('— stage ' + (c.stageIdx + 1) + ' —', 'meta');
      rollNextEvent();
      setBusy(false);
    }, 1100);
  }

  // Called after a WRONG stage pick. Boss damages player but puzzle still
  // advances to the next stage (no reset). When stage 5 finishes via a wrong
  // pick, the perfect-run check fails and we enter blade phase.
  function bossPunishAndAdvance() {
    var c = state.combat;
    var enemy = ENEMY_BY_ID[c.enemyId];

    var sides = enemy.failDmg.dice, count = enemy.failDmg.count, bonus = enemy.failDmg.bonus;
    var dmg = bonus;
    for (var i = 0; i < count; i++) dmg += rollD(sides);
    setTimeout(function () { flashDice(dmg, 'boss hits'); }, 200);

    setTimeout(function () {
      c.player.hp -= dmg;
      if (c.player.hp < 0) c.player.hp = 0;
      logLine('You take ' + dmg + ' damage. The puzzle rolls on — no take-backs.', 'foe');
      spawnFloater('-' + dmg, 'crit');
      updateHPBars();

      if (c.player.hp <= 0) {
        setTimeout(function () {
          showBubble('boss', pick(enemy.defeatLine).replace(/^"|"$/g, ''), 4400);
          logLine(pick(enemy.defeatLine), 'foe');
          setTimeout(function () { endFight(false); }, 1400);
        }, 700);
        return;
      }

      // Advance stage (no boss damage from wrong pick)
      c.stageIdx += 1;
      if (c.stageIdx >= enemy.stages.length) {
        // Imperfect — must finish with blade
        return enterBladePhase();
      }
      if (Math.random() < 0.35) {
        setTimeout(function () { logLine(pick(META), 'meta'); }, 200);
      }
      pushLogDivider();
      logLine('— stage ' + (c.stageIdx + 1) + ' —', 'meta');
      rollNextEvent();
      setBusy(false);
    }, 900);
  }

  function enterBladePhase() {
    var c = state.combat;
    c.bladePhase = true;
    pushLogDivider();
    logLine('— the puzzle is done. you missed too many beats for the elegant kill. —', 'meta');
    logLine('only honest steel will finish them now. ATTACK to whittle them down.', 'meta');
    showBubble('boss',
      '[I am hurt. But you didn\'t EARN the cinematic kill. We do this the long way now.]', 5400);
    setBusy(false);
  }

  function triggerInstakill() {
    var c = state.combat;
    var enemy = ENEMY_BY_ID[c.enemyId];
    var line = pick(enemy.instakill);

    setTimeout(function () {
      flashDice(20, 'INSTAKILL');
      c.enemy.hp = 0;
      updateHPBars();
      logLine(line, 'right');
      spawnFloater('INSTAKILL', 'crit');
      showBubble('boss', pick(enemy.bossReactRight), 5200);
    }, 400);

    setTimeout(function () { logLine(pick(META_WIN), 'meta'); }, 2200);
    setTimeout(function () { logLine(pick(HERO_HIT_QUIPS), 'you'); }, 3200);
    setTimeout(function () { endFight(true, 'instakill'); }, 5000);
  }

  function triggerBladeKill() {
    var c = state.combat;
    var enemy = ENEMY_BY_ID[c.enemyId];
    var line = pick(enemy.bladeKill);

    setTimeout(function () {
      logLine('— the boss buckles under your steady blade —', 'right');
      logLine(line, 'foe');
      showBubble('boss', line.replace(/^"|"$/g, ''), 5200);
      spawnFloater('BLADE KILL', 'crit');
    }, 600);

    setTimeout(function () {
      logLine('[Achievement: "Honest Steel" — you finished them the long way]', 'meta');
    }, 2200);
    setTimeout(function () { logLine(pick(HERO_HIT_QUIPS), 'you'); }, 3200);
    setTimeout(function () { endFight(true, 'blade'); }, 5000);
  }

  // ----- Emergency actions ----------------------------------------------
  //
  // ATTACK: chips damage with no charges and no HP cap. Chip-kill IS possible,
  // but the boss attacks back each turn and hits much harder than you chip —
  // the math is brutal. Most players will bleed out before chipping a boss flat.

  function onAttack() {
    var c = state.combat;
    if (!c || c.finished || c.busy) return;
    var luckMax = c.player.stats.LUCK === 10;

    setBusy(true);
    var dmg = rollD(10) + Math.floor(c.player.stats.MIGHT / 2);
    if (luckMax) dmg += 5;
    logLine(pick(ATTACK_LINES), 'you');
    setTimeout(function () { flashDice(dmg, 'attack'); }, 250);
    setTimeout(function () {
      c.enemy.hp -= dmg;
      if (c.enemy.hp < 0) c.enemy.hp = 0;
      updateHPBars();
      spawnFloater('-' + dmg, 'crit');
      logLine('Your strike chips ' + dmg + ' off the boss.', 'hit');

      if (c.enemy.hp <= 0) {
        return triggerBladeKill();
      }
      setTimeout(bossAttackOnly, 700);
    }, 900);
  }

  function onDefend() {
    var c = state.combat;
    if (!c || c.finished || c.busy) return;
    setBusy(true);
    var heal = rollD(6) + Math.floor(c.player.stats.VIGOR / 2);
    if (c.player.stats.LUCK === 10) heal += 5;
    c.player.hp = Math.min(c.player.maxHp, c.player.hp + heal);
    logLine(pick(DEFEND_LINES), 'you');
    setTimeout(function () { flashDice(heal, 'heal'); }, 250);
    setTimeout(function () {
      spawnFloater('+' + heal, 'heal');
      logLine('You brace and heal for ' + heal + ' HP.', 'right');
      updateHPBars();
      // Boss still attacks back, but DEFEND halves the incoming damage
      setTimeout(function () { bossAttackOnly(true); }, 700);
    }, 900);
  }

  // Single boss attack — no puzzle reset. Used after SMITE/DEFEND.
  // If `defending` is true, damage is halved.
  function bossAttackOnly(defending) {
    var c = state.combat;
    if (!c || c.finished) return;
    var enemy = ENEMY_BY_ID[c.enemyId];
    var luckMax = c.player.stats.LUCK === 10;

    // LUCK 10 — boss whiffs ~30% of the time on emergency turns too
    if (luckMax && Math.random() < 0.3) {
      logLine('The ' + enemy.name + ' swings and somehow misses. ' + pick(LUCK_TAGS), 'lucky');
      spawnFloater('MISS', 'lucky');
      setBusy(false);
      return;
    }

    var sides = enemy.dmg.dice, count = enemy.dmg.count, bonus = enemy.dmg.bonus;
    var dmg = bonus;
    for (var i = 0; i < count; i++) dmg += rollD(sides);
    if (defending) dmg = Math.max(1, Math.floor(dmg / 2));
    setTimeout(function () { flashDice(dmg, 'boss atk'); }, 200);

    setTimeout(function () {
      c.player.hp -= dmg;
      if (c.player.hp < 0) c.player.hp = 0;
      logLine('The ' + enemy.name + ' attacks. You take ' + dmg + ' damage' +
              (defending ? ' (defended ×½)' : '') + '.', 'foe');
      spawnFloater('-' + dmg, 'crit');
      updateHPBars();

      if (c.player.hp <= 0) {
        setTimeout(function () {
          showBubble('boss', pick(enemy.defeatLine).replace(/^"|"$/g, ''), 4400);
          logLine(pick(enemy.defeatLine), 'foe');
          setTimeout(function () { endFight(false); }, 1400);
        }, 600);
      } else {
        setBusy(false);
      }
    }, 800);
  }

  // ----- End of fight ----------------------------------------------------

  function endFight(won, winKind) {
    var c = state.combat;
    c.finished = true;
    pushLogDivider();
    if (won) {
      logLine(pick(VICTORY), 'victory');
      state.defeated[c.enemyId] = true;
    } else {
      logLine(pick(DEFEAT), 'defeat');
    }
    state.lastResult = {
      won: won,
      winKind: winKind || (won ? 'instakill' : 'killed'),
      enemyId: c.enemyId,
      enemyName: c.enemyName,
      luck: c.player.stats.LUCK,
      stats: cloneStats(c.player.stats),
      turns: c.turnCount,
      stagesCleared: c.stageIdx
    };
    // Longer pause so players can read the final boss/hero lines before
    // the result screen takes over.
    setTimeout(function () { state.screen = 'result'; render(); }, 4200);
  }

  // ============================================================
  //   RESULT
  // ============================================================

  function renderResult(el) {
    var r = state.lastResult;
    var enemy = ENEMY_BY_ID[r.enemyId];
    var wrap = document.createElement('div');
    wrap.className = 'result-wrap';

    var banner = document.createElement('div');
    banner.className = 'result-banner ' + (r.won ? 'win' : 'lose');
    banner.textContent = r.won ? 'Victory' : 'Defeat';
    wrap.appendChild(banner);

    var info = document.createElement('div');
    info.className = 'result-info';
    var line1;
    if (!r.won) {
      line1 = 'You fell to ' + r.enemyName + ' (' + r.stagesCleared +
              ' / ' + enemy.stages.length + ' stages cleared).';
    } else if (r.winKind === 'blade') {
      line1 = 'You ground ' + r.enemyName + ' down with honest steel over ' +
              r.turns + ' turns. The bards have been told to ABRIDGE this.';
    } else {
      line1 = 'You bested ' + r.enemyName + ' through all ' + enemy.stages.length +
              ' stages in ' + r.turns + ' turns.';
    }
    var line2 = 'Build · MIGHT ' + r.stats.MIGHT + ' · AGI ' + r.stats.AGI +
                ' · VIGOR ' + r.stats.VIGOR + ' · WILL ' + r.stats.WILL +
                ' · LUCK ' + r.stats.LUCK;
    info.innerHTML = line1 + '<br>' + line2;
    if (r.won && r.luck === 10 && r.enemyId === 'praevus') {
      info.innerHTML += '<br><br><span style="color:#FFD24A;font-weight:700;letter-spacing:2px">' +
        'mathematics has filed a formal complaint</span>';
    } else if (r.won && r.winKind === 'blade') {
      info.innerHTML += '<br><br><span style="color:#7ABC78;font-weight:700;letter-spacing:2px">' +
        'honest steel</span>';
    }
    wrap.appendChild(info);

    var btns = document.createElement('div');
    btns.className = 'alloc-buttons';
    var again = document.createElement('button');
    again.className = 'btn';
    again.textContent = 'fight again';
    again.addEventListener('click', function () {
      state.selectedEnemyId = r.enemyId;
      state.stats = cloneStats(DEFAULT_STATS);
      state.screen = 'allocate';
      render();
    });
    var back = document.createElement('button');
    back.className = 'btn primary';
    back.textContent = 'back to roster';
    back.addEventListener('click', function () {
      state.selectedEnemyId = null;
      state.screen = 'roster';
      render();
    });
    btns.appendChild(again);
    btns.appendChild(back);
    wrap.appendChild(btns);

    el.appendChild(wrap);
  }

  // ============================================================
  //   BOOTSTRAP
  // ============================================================

  function init() {
    var root = document.createElement('div');
    root.className = 'arena-root';
    root.id = 'arena-root';
    root.innerHTML = ''
      + '<div class="arena-back"><a href="/">← back to avidan shah</a></div>'
      + '<h1 class="arena-title">d20 Arena</h1>'
      + '<p class="arena-sub">read the room ‧ pick the door ‧ pray to the dice</p>'
      + '<div class="arena-screen" id="arena-screen"></div>';

    var main = $('main') || document.body;
    main.innerHTML = '';
    main.appendChild(root);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
