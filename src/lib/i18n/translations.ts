/**
 * synclulu i18n - Multi-language Support
 * Languages: DE, EN, ES, FR, PT
 */

export type Language = 'de' | 'en' | 'es' | 'fr' | 'pt';

export const LANGUAGES: Record<Language, { name: string; flag: string; native: string }> = {
  de: { name: 'German', flag: '🇩🇪', native: 'Deutsch' },
  en: { name: 'English', flag: '🇬🇧', native: 'English' },
  es: { name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  fr: { name: 'French', flag: '🇫🇷', native: 'Français' },
  pt: { name: 'Portuguese', flag: '🇧🇷', native: 'Português' },
};

export const translations = {
  // ═══════════════════════════════════════
  // COMMON
  // ═══════════════════════════════════════
  common: {
    save: {
      de: 'Speichern',
      en: 'Save',
      es: 'Guardar',
      fr: 'Enregistrer',
      pt: 'Salvar',
    },
    cancel: {
      de: 'Abbrechen',
      en: 'Cancel',
      es: 'Cancelar',
      fr: 'Annuler',
      pt: 'Cancelar',
    },
    confirm: {
      de: 'Bestätigen',
      en: 'Confirm',
      es: 'Confirmar',
      fr: 'Confirmer',
      pt: 'Confirmar',
    },
    delete: {
      de: 'Löschen',
      en: 'Delete',
      es: 'Eliminar',
      fr: 'Supprimer',
      pt: 'Excluir',
    },
    edit: {
      de: 'Bearbeiten',
      en: 'Edit',
      es: 'Editar',
      fr: 'Modifier',
      pt: 'Editar',
    },
    back: {
      de: 'Zurück',
      en: 'Back',
      es: 'Atrás',
      fr: 'Retour',
      pt: 'Voltar',
    },
    next: {
      de: 'Weiter',
      en: 'Next',
      es: 'Siguiente',
      fr: 'Suivant',
      pt: 'Próximo',
    },
    done: {
      de: 'Fertig',
      en: 'Done',
      es: 'Hecho',
      fr: 'Terminé',
      pt: 'Concluído',
    },
    loading: {
      de: 'Lädt...',
      en: 'Loading...',
      es: 'Cargando...',
      fr: 'Chargement...',
      pt: 'Carregando...',
    },
    retry: {
      de: 'Erneut versuchen',
      en: 'Retry',
      es: 'Reintentar',
      fr: 'Réessayer',
      pt: 'Tentar novamente',
    },
  },

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════
  nav: {
    home: {
      de: 'Home',
      en: 'Home',
      es: 'Inicio',
      fr: 'Accueil',
      pt: 'Início',
    },
    discover: {
      de: 'Entdecken',
      en: 'Discover',
      es: 'Descubrir',
      fr: 'Découvrir',
      pt: 'Descobrir',
    },
    messages: {
      de: 'Nachrichten',
      en: 'Messages',
      es: 'Mensajes',
      fr: 'Messages',
      pt: 'Mensagens',
    },
    profile: {
      de: 'Profil',
      en: 'Profile',
      es: 'Perfil',
      fr: 'Profil',
      pt: 'Perfil',
    },
  },

  // ═══════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════
  profile: {
    title: {
      de: 'Profil',
      en: 'Profile',
      es: 'Perfil',
      fr: 'Profil',
      pt: 'Perfil',
    },
    editProfile: {
      de: 'Profil bearbeiten',
      en: 'Edit Profile',
      es: 'Editar perfil',
      fr: 'Modifier le profil',
      pt: 'Editar perfil',
    },
    bioPlaceholder: {
      de: 'Erzähl was über dich...',
      en: 'Tell us about yourself...',
      es: 'Cuéntanos sobre ti...',
      fr: 'Parlez-nous de vous...',
      pt: 'Conte-nos sobre você...',
    },
    noBio: {
      de: 'Keine Bio. Ein Mensch der Geheimnisse.',
      en: 'No bio. A person of mystery.',
      es: 'Sin bio. Una persona misteriosa.',
      fr: 'Pas de bio. Une personne mystérieuse.',
      pt: 'Sem bio. Uma pessoa misteriosa.',
    },
    stats: {
      friends: {
        de: 'Freunde',
        en: 'Friends',
        es: 'Amigos',
        fr: 'Amis',
        pt: 'Amigos',
      },
      trust: {
        de: 'Trust',
        en: 'Trust',
        es: 'Confianza',
        fr: 'Confiance',
        pt: 'Confiança',
      },
      voiceMin: {
        de: 'Voice Min',
        en: 'Voice Min',
        es: 'Min de Voz',
        fr: 'Min Vocal',
        pt: 'Min de Voz',
      },
    },
    logout: {
      de: 'Abmelden',
      en: 'Log out',
      es: 'Cerrar sesión',
      fr: 'Déconnexion',
      pt: 'Sair',
    },
    loggingOut: {
      de: 'Wird abgemeldet...',
      en: 'Logging out...',
      es: 'Cerrando sesión...',
      fr: 'Déconnexion...',
      pt: 'Saindo...',
    },
  },

  // ═══════════════════════════════════════
  // LEVEL SYSTEM
  // ═══════════════════════════════════════
  level: {
    level: {
      de: 'Level',
      en: 'Level',
      es: 'Nivel',
      fr: 'Niveau',
      pt: 'Nível',
    },
    xpToNext: {
      de: 'XP zum nächsten Level',
      en: 'XP to next level',
      es: 'XP para el siguiente nivel',
      fr: 'XP pour le prochain niveau',
      pt: 'XP para o próximo nível',
    },
    titles: {
      newcomer: {
        de: 'Newcomer',
        en: 'Newcomer',
        es: 'Novato',
        fr: 'Nouveau',
        pt: 'Novato',
      },
      dreamer: {
        de: 'Dreamer',
        en: 'Dreamer',
        es: 'Soñador',
        fr: 'Rêveur',
        pt: 'Sonhador',
      },
      connector: {
        de: 'Connector',
        en: 'Connector',
        es: 'Conector',
        fr: 'Connecteur',
        pt: 'Conector',
      },
      socialite: {
        de: 'Socialite',
        en: 'Socialite',
        es: 'Socialité',
        fr: 'Mondain',
        pt: 'Socialite',
      },
      influencer: {
        de: 'Influencer',
        en: 'Influencer',
        es: 'Influencer',
        fr: 'Influenceur',
        pt: 'Influenciador',
      },
      legend: {
        de: 'Legend',
        en: 'Legend',
        es: 'Leyenda',
        fr: 'Légende',
        pt: 'Lenda',
      },
    },
    levelUp: {
      de: 'Du bist jetzt offiziell weniger irrelevant. Willkommen auf Level {level}.',
      en: "You're officially less irrelevant now. Welcome to Level {level}.",
      es: 'Ahora eres oficialmente menos irrelevante. Bienvenido al Nivel {level}.',
      fr: 'Tu es officiellement moins insignifiant maintenant. Bienvenue au Niveau {level}.',
      pt: 'Você agora é oficialmente menos irrelevante. Bem-vindo ao Nível {level}.',
    },
  },

  // ═══════════════════════════════════════
  // STREAK
  // ═══════════════════════════════════════
  streak: {
    title: {
      de: 'Streak',
      en: 'Streak',
      es: 'Racha',
      fr: 'Série',
      pt: 'Sequência',
    },
    days: {
      de: 'Tage',
      en: 'days',
      es: 'días',
      fr: 'jours',
      pt: 'dias',
    },
    xpBoost: {
      de: 'XP Boost',
      en: 'XP Boost',
      es: 'Bonus de XP',
      fr: 'Bonus XP',
      pt: 'Bônus de XP',
    },
    lost: {
      de: 'Streak verloren. Das war wohl nichts. Aber hey, morgen ist ein neuer Tag.',
      en: "Streak lost. That didn't work out. But hey, tomorrow's a new day.",
      es: 'Racha perdida. Eso no funcionó. Pero oye, mañana es un nuevo día.',
      fr: "Série perdue. Ça n'a pas marché. Mais bon, demain est un autre jour.",
      pt: 'Sequência perdida. Não deu certo. Mas ei, amanhã é um novo dia.',
    },
    frozen: {
      de: 'Streak eingefroren. Ausnahmsweise.',
      en: 'Streak frozen. Just this once.',
      es: 'Racha congelada. Solo por esta vez.',
      fr: 'Série gelée. Exceptionnellement.',
      pt: 'Sequência congelada. Só desta vez.',
    },
  },

  // ═══════════════════════════════════════
  // VISIBILITY
  // ═══════════════════════════════════════
  visibility: {
    title: {
      de: 'Wer darf dich sehen?',
      en: 'Who can see you?',
      es: '¿Quién puede verte?',
      fr: 'Qui peut te voir?',
      pt: 'Quem pode te ver?',
    },
    public: {
      title: {
        de: 'Alle in Reichweite',
        en: 'Everyone nearby',
        es: 'Todos cerca',
        fr: 'Tout le monde à proximité',
        pt: 'Todos por perto',
      },
      description: {
        de: 'Jeder im Radius kann dich sehen',
        en: 'Anyone in range can see you',
        es: 'Cualquiera en el rango puede verte',
        fr: 'Tout le monde dans le rayon peut te voir',
        pt: 'Qualquer um no raio pode te ver',
      },
      hint: {
        de: 'Alle sehen dich. Kein Verstecken.',
        en: 'Everyone sees you. No hiding.',
        es: 'Todos te ven. Sin esconderse.',
        fr: 'Tout le monde te voit. Pas de cachette.',
        pt: 'Todos te veem. Sem se esconder.',
      },
    },
    friends: {
      title: {
        de: 'Nur meine Freunde',
        en: 'Only my friends',
        es: 'Solo mis amigos',
        fr: 'Seulement mes amis',
        pt: 'Apenas meus amigos',
      },
      description: {
        de: 'Fremde sehen dich nicht',
        en: "Strangers can't see you",
        es: 'Los extraños no pueden verte',
        fr: 'Les inconnus ne te voient pas',
        pt: 'Estranhos não podem te ver',
      },
      hint: {
        de: 'Nur deine Freunde sehen dich. Exklusivclub.',
        en: 'Only your friends see you. Exclusive club.',
        es: 'Solo tus amigos te ven. Club exclusivo.',
        fr: 'Seuls tes amis te voient. Club exclusif.',
        pt: 'Só seus amigos te veem. Clube exclusivo.',
      },
    },
    ghost: {
      title: {
        de: 'Niemand (Ghost Mode) 👻',
        en: 'Nobody (Ghost Mode) 👻',
        es: 'Nadie (Modo Fantasma) 👻',
        fr: 'Personne (Mode Fantôme) 👻',
        pt: 'Ninguém (Modo Fantasma) 👻',
      },
      description: {
        de: 'Du bist komplett unsichtbar',
        en: "You're completely invisible",
        es: 'Eres completamente invisible',
        fr: 'Tu es complètement invisible',
        pt: 'Você está completamente invisível',
      },
      hint: {
        de: 'Ghost Mode aktiv. Du existierst nicht. Sehr dramatisch.',
        en: "Ghost Mode active. You don't exist. Very dramatic.",
        es: 'Modo Fantasma activo. No existes. Muy dramático.',
        fr: "Mode Fantôme actif. Tu n'existes pas. Très dramatique.",
        pt: 'Modo Fantasma ativo. Você não existe. Muito dramático.',
      },
    },
  },

  // ═══════════════════════════════════════
  // FRIEND RADAR
  // ═══════════════════════════════════════
  friendRadar: {
    title: {
      de: 'Friend-Radar',
      en: 'Friend Radar',
      es: 'Radar de Amigos',
      fr: 'Radar Amis',
      pt: 'Radar de Amigos',
    },
    description: {
      de: 'Benachrichtigung im 10km Radius',
      en: 'Notification within 10km radius',
      es: 'Notificación en radio de 10km',
      fr: 'Notification dans un rayon de 10km',
      pt: 'Notificação em raio de 10km',
    },
    notification: {
      de: '{name} ist im 10km-Radius. Keine Sorge, er kann dich nicht hören – es sei denn, du willst es.',
      en: "{name} is within 10km. Don't worry, they can't hear you – unless you want them to.",
      es: '{name} está a 10km. No te preocupes, no pueden oírte – a menos que quieras.',
      fr: "{name} est à 10km. T'inquiète, ils ne peuvent pas t'entendre – sauf si tu le veux.",
      pt: '{name} está a 10km. Não se preocupe, eles não podem te ouvir – a menos que você queira.',
    },
    enabled: {
      de: 'Friend-Radar aktiv',
      en: 'Friend Radar active',
      es: 'Radar de Amigos activo',
      fr: 'Radar Amis actif',
      pt: 'Radar de Amigos ativo',
    },
    disabled: {
      de: 'Friend-Radar aus. Du willst also überrascht werden? Mutig.',
      en: 'Friend Radar off. So you want to be surprised? Bold.',
      es: 'Radar de Amigos apagado. ¿Quieres sorpresas? Valiente.',
      fr: 'Radar Amis désactivé. Tu veux être surpris? Audacieux.',
      pt: 'Radar de Amigos desligado. Quer ser surpreendido? Corajoso.',
    },
  },

  // ═══════════════════════════════════════
  // SEARCH RADIUS
  // ═══════════════════════════════════════
  radius: {
    title: {
      de: 'Suchradius',
      en: 'Search Radius',
      es: 'Radio de Búsqueda',
      fr: 'Rayon de Recherche',
      pt: 'Raio de Busca',
    },
    description: {
      de: 'Wie weit siehst du andere?',
      en: 'How far can you see others?',
      es: '¿Qué tan lejos puedes ver a otros?',
      fr: 'À quelle distance peux-tu voir les autres?',
      pt: 'Até onde você pode ver os outros?',
    },
    hint: {
      max: {
        de: 'Maximale Reichweite. Viel Spaß mit dem Chaos.',
        en: 'Maximum range. Have fun with the chaos.',
        es: 'Alcance máximo. Diviértete con el caos.',
        fr: 'Portée maximale. Amuse-toi avec le chaos.',
        pt: 'Alcance máximo. Divirta-se com o caos.',
      },
      min: {
        de: 'Nur die Nächsten. Sehr... intim.',
        en: 'Only the closest. Very... intimate.',
        es: 'Solo los más cercanos. Muy... íntimo.',
        fr: 'Seulement les plus proches. Très... intime.',
        pt: 'Apenas os mais próximos. Muito... íntimo.',
      },
      default: {
        de: 'Sollte reichen.',
        en: 'Should be enough.',
        es: 'Debería ser suficiente.',
        fr: 'Ça devrait suffire.',
        pt: 'Deve ser suficiente.',
      },
    },
    error: {
      de: 'Nett versucht, aber die Physik lässt sich nicht austricksen. Wir kalibrieren den Radius neu.',
      en: "Nice try, but you can't trick physics. We're recalibrating the radius.",
      es: 'Buen intento, pero no puedes engañar a la física. Recalibrando el radio.',
      fr: "Bien essayé, mais tu ne peux pas tromper la physique. On recalibre le rayon.",
      pt: 'Boa tentativa, mas você não pode enganar a física. Recalibrando o raio.',
    },
  },

  // ═══════════════════════════════════════
  // PREMIUM
  // ═══════════════════════════════════════
  premium: {
    title: {
      de: 'CATALYST',
      en: 'CATALYST',
      es: 'CATALYST',
      fr: 'CATALYST',
      pt: 'CATALYST',
    },
    upsell: {
      de: 'Hör auf zu schleichen. Hol dir den Catalyst und sieh genau, wer in deiner Nähe ist, bevor sie dich sehen.',
      en: 'Stop lurking. Get Catalyst and see exactly who is near you before they see you.',
      es: 'Deja de acechar. Obtén Catalyst y ve exactamente quién está cerca antes de que te vean.',
      fr: "Arrête de rôder. Prends Catalyst et vois exactement qui est près de toi avant qu'ils te voient.",
      pt: 'Pare de espreitar. Obtenha o Catalyst e veja exatamente quem está perto antes que te vejam.',
    },
    upgrade: {
      de: 'Jetzt upgraden',
      en: 'Upgrade now',
      es: 'Actualizar ahora',
      fr: 'Mettre à niveau',
      pt: 'Atualizar agora',
    },
    features: {
      xpBoost: {
        de: '1.5x XP Boost – permanent',
        en: '1.5x XP Boost – permanent',
        es: '1.5x Bonus de XP – permanente',
        fr: '1.5x Bonus XP – permanent',
        pt: '1.5x Bônus de XP – permanente',
      },
      exactDistance: {
        de: 'Meter-genaue Distanzanzeige',
        en: 'Meter-precise distance display',
        es: 'Distancia precisa en metros',
        fr: 'Distance précise au mètre',
        pt: 'Distância precisa em metros',
      },
      profileStalker: {
        de: 'Sieh wer dein Profil besucht',
        en: 'See who viewed your profile',
        es: 'Ve quién visitó tu perfil',
        fr: 'Vois qui a visité ton profil',
        pt: 'Veja quem visitou seu perfil',
      },
      priorityListing: {
        de: 'Immer oben in der Liste',
        en: 'Always at the top of the list',
        es: 'Siempre arriba en la lista',
        fr: 'Toujours en haut de la liste',
        pt: 'Sempre no topo da lista',
      },
    },
  },

  // ═══════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════
  settings: {
    title: {
      de: 'Einstellungen',
      en: 'Settings',
      es: 'Configuración',
      fr: 'Paramètres',
      pt: 'Configurações',
    },
    blockedUsers: {
      de: 'Blockierte Nutzer',
      en: 'Blocked Users',
      es: 'Usuarios Bloqueados',
      fr: 'Utilisateurs Bloqués',
      pt: 'Usuários Bloqueados',
    },
    myStats: {
      de: 'Meine Statistiken',
      en: 'My Statistics',
      es: 'Mis Estadísticas',
      fr: 'Mes Statistiques',
      pt: 'Minhas Estatísticas',
    },
    notifications: {
      de: 'Benachrichtigungen',
      en: 'Notifications',
      es: 'Notificaciones',
      fr: 'Notifications',
      pt: 'Notificações',
    },
    appDesign: {
      de: 'App-Design',
      en: 'App Design',
      es: 'Diseño de la App',
      fr: 'Design de l\'App',
      pt: 'Design do App',
    },
    language: {
      de: 'Sprache',
      en: 'Language',
      es: 'Idioma',
      fr: 'Langue',
      pt: 'Idioma',
    },
    help: {
      de: 'Hilfe & FAQ',
      en: 'Help & FAQ',
      es: 'Ayuda y FAQ',
      fr: 'Aide et FAQ',
      pt: 'Ajuda e FAQ',
    },
  },

  // ═══════════════════════════════════════
  // MODERATION (Skeptic Style)
  // ═══════════════════════════════════════
  moderation: {
    shadowMuted: {
      de: 'Deine Vibes sind gerade ziemlich toxic. Wir haben dich mal kurz stummgeschaltet, damit die anderen in Ruhe weiterreden können. Atme mal tief durch.',
      en: "Your vibes are pretty toxic right now. We've muted you for a bit so others can chat in peace. Take a deep breath.",
      es: 'Tus vibes son bastante tóxicas ahora. Te silenciamos un rato para que otros puedan charlar en paz. Respira hondo.',
      fr: "Tes vibes sont assez toxiques là. On t'a mis en sourdine pour que les autres puissent discuter tranquilles. Respire un coup.",
      pt: 'Suas vibes estão bem tóxicas agora. Te silenciamos um pouco para os outros conversarem em paz. Respire fundo.',
    },
    tempBanned: {
      de: "OK, das war's erstmal für dich. Du bist für {hours}h auf Eis gelegt. Nutz die Zeit, um über deine Lebensentscheidungen nachzudenken.",
      en: "OK, that's it for now. You're on ice for {hours}h. Use the time to reflect on your life choices.",
      es: "OK, eso es todo por ahora. Estás en hielo por {hours}h. Usa el tiempo para reflexionar sobre tus decisiones de vida.",
      fr: "OK, c'est fini pour l'instant. Tu es sur glace pour {hours}h. Profite pour réfléchir à tes choix de vie.",
      pt: "OK, é isso por agora. Você está no gelo por {hours}h. Use o tempo para refletir sobre suas escolhas de vida.",
    },
    warning: {
      de: 'Heads up: Noch ein Ausrutscher und du landest auf der Bank. Deine Entscheidung.',
      en: "Heads up: One more slip and you're benched. Your call.",
      es: 'Aviso: Un error más y estás en la banca. Tu decisión.',
      fr: "Attention: Un faux pas de plus et tu es sur le banc. À toi de voir.",
      pt: 'Aviso: Mais um deslize e você vai pro banco. Sua decisão.',
    },
  },

  // ═══════════════════════════════════════
  // ERRORS (Skeptic Style)
  // ═══════════════════════════════════════
  errors: {
    generic: {
      de: 'Irgendwas ist schiefgelaufen. Wahrscheinlich nicht deine Schuld. Wahrscheinlich.',
      en: 'Something went wrong. Probably not your fault. Probably.',
      es: 'Algo salió mal. Probablemente no es tu culpa. Probablemente.',
      fr: "Quelque chose s'est mal passé. Probablement pas ta faute. Probablement.",
      pt: 'Algo deu errado. Provavelmente não é sua culpa. Provavelmente.',
    },
    network: {
      de: 'Keine Verbindung. Das Internet hat dich verlassen, nicht wir.',
      en: "No connection. The internet left you, not us.",
      es: 'Sin conexión. Internet te dejó, no nosotros.',
      fr: "Pas de connexion. Internet t'a quitté, pas nous.",
      pt: 'Sem conexão. A internet te deixou, não nós.',
    },
    location: {
      de: 'GPS-Signal verloren. Vielleicht stehst du in einem Bunker?',
      en: "GPS signal lost. Maybe you're in a bunker?",
      es: '¿Señal GPS perdida. Quizás estás en un búnker?',
      fr: "Signal GPS perdu. T'es peut-être dans un bunker?",
      pt: 'Sinal GPS perdido. Talvez você esteja em um bunker?',
    },
  },

  // ═══════════════════════════════════════
  // EMPTY STATES (Skeptic Style)
  // ═══════════════════════════════════════
  empty: {
    friends: {
      de: 'Noch keine Freunde. Das lässt sich ändern – geh raus und quatsch Leute an.',
      en: 'No friends yet. That can change – go out and talk to people.',
      es: 'Aún sin amigos. Eso puede cambiar – sal y habla con la gente.',
      fr: "Pas encore d'amis. Ça peut changer – sors et parle aux gens.",
      pt: 'Ainda sem amigos. Isso pode mudar – saia e fale com as pessoas.',
    },
    nearbyUsers: {
      de: 'Niemand in Reichweite. Entweder bist du allein, oder alle verstecken sich vor dir.',
      en: "No one in range. Either you're alone, or everyone's hiding from you.",
      es: 'Nadie en rango. O estás solo, o todos se esconden de ti.',
      fr: "Personne à portée. Soit t'es seul, soit tout le monde se cache de toi.",
      pt: 'Ninguém no alcance. Ou você está sozinho, ou todos estão se escondendo de você.',
    },
    messages: {
      de: 'Keine Nachrichten. Die Stille ist ohrenbetäubend.',
      en: 'No messages. The silence is deafening.',
      es: 'Sin mensajes. El silencio es ensordecedor.',
      fr: 'Pas de messages. Le silence est assourdissant.',
      pt: 'Sem mensagens. O silêncio é ensurdecedor.',
    },
  },

  // ═══════════════════════════════════════
  // AVATAR
  // ═══════════════════════════════════════
  avatar: {
    title: {
      de: 'Wähle deinen Avatar',
      en: 'Choose your avatar',
      es: 'Elige tu avatar',
      fr: 'Choisis ton avatar',
      pt: 'Escolha seu avatar',
    },
    subtitle: {
      de: 'Dein Avatar wird anderen angezeigt',
      en: 'Your avatar will be shown to others',
      es: 'Tu avatar se mostrará a otros',
      fr: 'Ton avatar sera montré aux autres',
      pt: 'Seu avatar será mostrado aos outros',
    },
    selected: {
      de: 'Ausgewählt',
      en: 'Selected',
      es: 'Seleccionado',
      fr: 'Sélectionné',
      pt: 'Selecionado',
    },
  },

  // ═══════════════════════════════════════
  // TRUST
  // ═══════════════════════════════════════
  trust: {
    trusted: {
      de: 'TRUSTED',
      en: 'TRUSTED',
      es: 'CONFIABLE',
      fr: 'FIABLE',
      pt: 'CONFIÁVEL',
    },
    reliable: {
      de: 'RELIABLE',
      en: 'RELIABLE',
      es: 'FIABLE',
      fr: 'SÉRIEUX',
      pt: 'CONFIÁVEL',
    },
    neutral: {
      de: 'NEUTRAL',
      en: 'NEUTRAL',
      es: 'NEUTRAL',
      fr: 'NEUTRE',
      pt: 'NEUTRO',
    },
    caution: {
      de: 'VORSICHT',
      en: 'CAUTION',
      es: 'PRECAUCIÓN',
      fr: 'ATTENTION',
      pt: 'CUIDADO',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations;
