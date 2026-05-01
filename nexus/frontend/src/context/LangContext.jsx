import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const LANGS = [
  { code:"en", label:"English",  flag:"🇬🇧" },
  { code:"hi", label:"हिन्दी",   flag:"🇮🇳" },
  { code:"es", label:"Español",  flag:"🇪🇸" },
  { code:"fr", label:"Français", flag:"🇫🇷" },
];

const T = {
  en: {
    feed:"Feed", discover:"Discover", messages:"Messages", alerts:"Alerts", profile:"Profile",
    goLive:"Go Live", newPost:"+ New Post", signIn:"Sign In", register:"Register",
    signOut:"Sign out", fullName:"Full name", username:"Username", password:"Password",
    yourFeed:"Your Feed", posts:"posts", whatsOnMind:"What's on your mind",
    share:"Share", expand:"Expand", newBadge:"NEW", writeComment:"Write a comment…",
    aiSuggest:"AI Suggest", postBtn:"Post", noComments:"No comments yet. Be the first!",
    likes:"likes", comments:"comments", newPostTitle:"New Post", cancel:"Cancel",
    publish:"Publish →", tagsPlaceholder:"Tags: design, dev, AI",
    aiAssistant:"✦ AI Writing Assistant", describeTopicAI:"Describe your topic — AI will draft a post.",
    aiPromptPlaceholder:"e.g. thoughts on remote work…", generateDraft:"Generate Draft",
    uploadImage:"Upload Image", cancelBtn:"✕ Cancel",
    discoverTitle:"Discover", discoverSub:"Find communities that match your interests",
    searchComm:"Search communities…", members:"members", joined:"✓ Joined", join:"Join",
    notifTitle:"Notifications", unread:"unread", markAllRead:"Mark all read",
    noNotifs:"No notifications yet.", messagesTitle:"Messages",
    newMessage:"+ New Message", selectConvo:"Select a conversation",
    typeMsgPlaceholder:"Type a message…", typing:"typing…",
    followers:"Followers", following:"Following", follow:"Follow", noPosts:"No posts yet.",
    myCommunities:"My Communities", joinHint:"Join communities to see them here.",
    people:"People", trending:"Trending", dm:"DM", language:"Language",
    published:"Post published! 🎉", commentPosted:"Comment posted!",
    justNow:"just now", tagline:"A space for curious minds.",
    welcomeBack:"Welcome back", createAccount:"Create your account",
    signInContinue:"Sign in to continue", joinToday:"Join the community today",
    signInArrow:"Sign In →", createArrow:"Create Account →",
    fillFields:"Please fill in all fields.",
  },
  hi: {
    feed:"फ़ीड", discover:"खोजें", messages:"संदेश", alerts:"सूचनाएँ", profile:"प्रोफ़ाइल",
    goLive:"लाइव जाएँ", newPost:"+ नई पोस्ट", signIn:"साइन इन", register:"पंजीकरण",
    signOut:"साइन आउट", fullName:"पूरा नाम", username:"उपयोगकर्ता नाम", password:"पासवर्ड",
    yourFeed:"आपकी फ़ीड", posts:"पोस्ट", whatsOnMind:"क्या सोच रहे हैं",
    share:"शेयर", expand:"विस्तार", newBadge:"नया", writeComment:"टिप्पणी लिखें…",
    aiSuggest:"AI सुझाव", postBtn:"पोस्ट", noComments:"कोई टिप्पणी नहीं।",
    likes:"पसंद", comments:"टिप्पणियाँ", newPostTitle:"नई पोस्ट", cancel:"रद्द",
    publish:"प्रकाशित →", tagsPlaceholder:"टैग: डिज़ाइन, देव", aiAssistant:"✦ AI लेखन",
    describeTopicAI:"विषय बताएं — AI मसौदा तैयार करेगा।", aiPromptPlaceholder:"विचार…",
    generateDraft:"मसौदा बनाएँ", uploadImage:"अपलोड", cancelBtn:"✕ रद्द",
    discoverTitle:"खोजें", discoverSub:"समुदाय खोजें", searchComm:"खोजें…",
    members:"सदस्य", joined:"✓ जुड़े", join:"जुड़ें", notifTitle:"सूचनाएँ",
    unread:"अपठित", markAllRead:"सब पढ़ा हुआ", noNotifs:"कोई सूचना नहीं।",
    messagesTitle:"संदेश", newMessage:"+ नया संदेश", selectConvo:"बातचीत चुनें",
    typeMsgPlaceholder:"संदेश लिखें…", typing:"टाइप…",
    followers:"फ़ॉलोअर", following:"फ़ॉलो", follow:"फ़ॉलो करें", noPosts:"कोई पोस्ट नहीं।",
    myCommunities:"मेरे समुदाय", joinHint:"समुदाय जुड़ें।", people:"लोग",
    trending:"ट्रेंडिंग", dm:"DM", language:"भाषा",
    published:"पोस्ट प्रकाशित! 🎉", commentPosted:"टिप्पणी पोस्ट हुई!",
    justNow:"अभी", tagline:"जिज्ञासु मन के लिए।",
    welcomeBack:"वापसी पर स्वागत", createAccount:"खाता बनाएँ",
    signInContinue:"साइन इन करें", joinToday:"आज जुड़ें",
    signInArrow:"साइन इन →", createArrow:"खाता बनाएँ →", fillFields:"सभी फ़ील्ड भरें।",
  },
  es: {
    feed:"Inicio", discover:"Descubrir", messages:"Mensajes", alerts:"Alertas",
    profile:"Perfil", goLive:"En vivo", newPost:"+ Nueva publicación",
    signIn:"Iniciar sesión", register:"Registrarse", signOut:"Cerrar sesión",
    fullName:"Nombre completo", username:"Usuario", password:"Contraseña",
    yourFeed:"Tu inicio", posts:"publicaciones", whatsOnMind:"¿En qué piensas",
    share:"Compartir", expand:"Expandir", newBadge:"NUEVO", writeComment:"Escribe un comentario…",
    aiSuggest:"Sugerir IA", postBtn:"Publicar", noComments:"Sin comentarios. ¡Sé el primero!",
    likes:"me gusta", comments:"comentarios", newPostTitle:"Nueva publicación",
    cancel:"Cancelar", publish:"Publicar →", tagsPlaceholder:"Tags: diseño, dev",
    aiAssistant:"✦ Asistente IA", describeTopicAI:"Describe tu tema.",
    aiPromptPlaceholder:"ej. trabajo remoto…", generateDraft:"Generar borrador",
    uploadImage:"Subir imagen", cancelBtn:"✕ Cancelar",
    discoverTitle:"Descubrir", discoverSub:"Encuentra comunidades", searchComm:"Buscar…",
    members:"miembros", joined:"✓ Unido", join:"Unirse",
    notifTitle:"Notificaciones", unread:"sin leer", markAllRead:"Marcar todo",
    noNotifs:"Sin notificaciones.", messagesTitle:"Mensajes",
    newMessage:"+ Nuevo mensaje", selectConvo:"Selecciona conversación",
    typeMsgPlaceholder:"Escribe…", typing:"escribiendo…",
    followers:"Seguidores", following:"Siguiendo", follow:"Seguir", noPosts:"Sin publicaciones.",
    myCommunities:"Mis comunidades", joinHint:"Únete a comunidades.", people:"Personas",
    trending:"Tendencias", dm:"MD", language:"Idioma",
    published:"¡Publicado! 🎉", commentPosted:"¡Comentario publicado!",
    justNow:"ahora", tagline:"Un espacio para mentes curiosas.",
    welcomeBack:"Bienvenido de nuevo", createAccount:"Crea tu cuenta",
    signInContinue:"Inicia sesión", joinToday:"Únete hoy",
    signInArrow:"Iniciar →", createArrow:"Crear cuenta →", fillFields:"Completa todos los campos.",
  },
  fr: {
    feed:"Accueil", discover:"Découvrir", messages:"Messages", alerts:"Alertes",
    profile:"Profil", goLive:"En direct", newPost:"+ Nouvelle publication",
    signIn:"Se connecter", register:"S'inscrire", signOut:"Se déconnecter",
    fullName:"Nom complet", username:"Nom d'utilisateur", password:"Mot de passe",
    yourFeed:"Votre fil", posts:"publications", whatsOnMind:"À quoi pensez-vous",
    share:"Partager", expand:"Agrandir", newBadge:"NOUVEAU", writeComment:"Écrire un commentaire…",
    aiSuggest:"Suggestion IA", postBtn:"Publier", noComments:"Pas encore de commentaires.",
    likes:"j'aime", comments:"commentaires", newPostTitle:"Nouvelle publication",
    cancel:"Annuler", publish:"Publier →", tagsPlaceholder:"Tags: design, dev",
    aiAssistant:"✦ Assistant IA", describeTopicAI:"Décrivez votre sujet.",
    aiPromptPlaceholder:"ex. travail à distance…", generateDraft:"Générer",
    uploadImage:"Téléverser", cancelBtn:"✕ Annuler",
    discoverTitle:"Découvrir", discoverSub:"Trouvez des communautés", searchComm:"Rechercher…",
    members:"membres", joined:"✓ Rejoint", join:"Rejoindre",
    notifTitle:"Notifications", unread:"non lues", markAllRead:"Tout marquer",
    noNotifs:"Pas de notifications.", messagesTitle:"Messages",
    newMessage:"+ Nouveau message", selectConvo:"Sélectionnez",
    typeMsgPlaceholder:"Tapez…", typing:"en train d'écrire…",
    followers:"Abonnés", following:"Abonnements", follow:"Suivre", noPosts:"Pas de publications.",
    myCommunities:"Mes communautés", joinHint:"Rejoignez des communautés.", people:"Personnes",
    trending:"Tendances", dm:"MP", language:"Langue",
    published:"Publié ! 🎉", commentPosted:"Commentaire publié!",
    justNow:"à l'instant", tagline:"Un espace pour les esprits curieux.",
    welcomeBack:"Bon retour", createAccount:"Créer votre compte",
    signInContinue:"Connectez-vous", joinToday:"Rejoignez aujourd'hui",
    signInArrow:"Se connecter →", createArrow:"Créer un compte →", fillFields:"Veuillez remplir tous les champs.",
  },
};

const LangContext = createContext({ t: (k) => k, lang: "en", setLang: () => {}, LANGS });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem("nexus_lang");
    if (saved) return saved;
    const code = (navigator.language || "en").slice(0, 2).toLowerCase();
    return Object.keys(T).includes(code) ? code : "en";
  });

  useEffect(() => { localStorage.setItem("nexus_lang", lang); }, [lang]);

  const t = useCallback((key) => T[lang]?.[key] ?? T.en[key] ?? key, [lang]);

  return (
    <LangContext.Provider value={{ t, lang, setLang, LANGS }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() { return useContext(LangContext); }
