// Translation context and data
export type Language = 'en' | 'es'

export interface Translations {
  // Header & Navigation
  getStarted: string
  learnMore: string
  
  // Hero Section
  heroTitle: string
  heroSubtitle: string
  trustText: string
  
  // How It Works
  howItWorksTitle: string
  howItWorksSubtitle: string
  findTitle: string
  findDescription: string
  bookTitle: string
  bookDescription: string
  trainTitle: string
  trainDescription: string
  
  // Benefits
  benefitsTitle: string
  saveMoneyText: string
  noContractsText: string
  discoverSpotsText: string
  mobilePassText: string
  pricingText: string
  
  // Social Proof
  testimonialsTitle: string
  testimonial1: string
  testimonial2: string
  role1: string
  role2: string
  featuredGymsText: string
  
  // Demo Section
  demoTitle: string
  demoDescription: string
  tryDemo: string
  
  // Final CTA
  finalCtaTitle: string
  finalCtaDescription: string
  getStartedToday: string
  
  // Footer
  terms: string
  privacy: string
  contact: string
  
  // Auth Dialog
  authTitle: string
  email: string
  password: string
  createAccount: string
  creatingAccount: string
  
  // ARIA Labels
  ariaSignUp: string
  ariaLearnMore: string
  ariaCloseDialog: string
  ariaTryDemo: string
  ariaFinalCta: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header & Navigation
    getStarted: "Get Started",
    learnMore: "Learn more",
    
    // Hero Section
    heroTitle: "One pass. Every gym in Cabo.",
    heroSubtitle: "Try gyms, studios, and classes with one simple pass.",
    trustText: "Trusted by 300+ fitness enthusiasts in Los Cabos",
    
    // How It Works
    howItWorksTitle: "How It Works",
    howItWorksSubtitle: "Get started in three simple steps",
    findTitle: "Find",
    findDescription: "Browse gyms and studios across Cabo",
    bookTitle: "Book",
    bookDescription: "Reserve your spot in any class",
    trainTitle: "Train",
    trainDescription: "Show up and get your workout on",
    
    // Benefits
    benefitsTitle: "Why Choose Cabo Fit Pass?",
    saveMoneyText: "Save money",
    noContractsText: "No contracts",
    discoverSpotsText: "Discover new spots",
    mobilePassText: "Mobile pass",
    pricingText: "From $550 MXN per month. Cancel anytime.",
    
    // Social Proof
    testimonialsTitle: "What Our Members Say",
    testimonial1: "Best investment I've made for my fitness routine. Access to all the top gyms without the commitment.",
    testimonial2: "Love trying different studios every week. The variety keeps my workouts exciting and challenging.",
    role1: "Real Estate Agent",
    role2: "Local Business Owner",
    featuredGymsText: "Featured Partner Gyms",
    
    // Demo Section
    demoTitle: "Try Before You Commit",
    demoDescription: "Explore our platform with a free demo. See how easy it is to discover and book a class in Los Cabos.",
    tryDemo: "Try the Demo",
    
    // Final CTA
    finalCtaTitle: "Ready to Transform Your Fitness?",
    finalCtaDescription: "Join hundreds of members who are already discovering the best gyms in Cabo.",
    getStartedToday: "Get Started Today",
    
    // Footer
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
    
    // Auth Dialog
    authTitle: "Get Started",
    email: "Email",
    password: "Password",
    createAccount: "Create Account",
    creatingAccount: "Creating Account...",
    
    // ARIA Labels
    ariaSignUp: "Sign up for Cabo Fit Pass",
    ariaLearnMore: "Learn more about how it works",
    ariaCloseDialog: "Close dialog",
    ariaTryDemo: "Try the demo dashboard",
    ariaFinalCta: "Get started with Cabo Fit Pass today"
  },
  
  es: {
    // Header & Navigation
    getStarted: "Comenzar",
    learnMore: "Saber más",
    
    // Hero Section
    heroTitle: "Un pase. Todos los gimnasios en Cabo.",
    heroSubtitle: "Prueba gimnasios, estudios y clases con un solo pase simple.",
    trustText: "Confiado por 300+ entusiastas del fitness en Los Cabos",
    
    // How It Works
    howItWorksTitle: "Cómo Funciona",
    howItWorksSubtitle: "Comienza en tres pasos simples",
    findTitle: "Encuentra",
    findDescription: "Explora gimnasios y estudios en todo Cabo",
    bookTitle: "Reserva",
    bookDescription: "Asegura tu lugar en cualquier clase",
    trainTitle: "Entrena",
    trainDescription: "Aparece y haz tu entrenamiento",
    
    // Benefits
    benefitsTitle: "¿Por Qué Elegir Cabo Fit Pass?",
    saveMoneyText: "Ahorra dinero",
    noContractsText: "Sin contratos",
    discoverSpotsText: "Descubre nuevos lugares",
    mobilePassText: "Pase móvil",
    pricingText: "Desde $550 MXN por mes. Cancela en cualquier momento.",
    
    // Social Proof
    testimonialsTitle: "Lo Que Dicen Nuestros Miembros",
    testimonial1: "La mejor inversión que he hecho para mi rutina de fitness. Acceso a todos los mejores gimnasios sin compromiso.",
    testimonial2: "Me encanta probar diferentes estudios cada semana. La variedad mantiene mis entrenamientos emocionantes y desafiantes.",
    role1: "Agente de Bienes Raíces",
    role2: "Propietario de Negocio Local",
    featuredGymsText: "Gimnasios Socios Destacados",
    
    // Demo Section
    demoTitle: "Prueba Antes de Comprometerte",
    demoDescription: "Explora nuestra plataforma con una demo gratis. Ve qué fácil es descubrir y reservar una clase en Los Cabos.",
    tryDemo: "Probar la Demo",
    
    // Final CTA
    finalCtaTitle: "¿Listo para Transformar tu Fitness?",
    finalCtaDescription: "Únete a cientos de miembros que ya están descubriendo los mejores gimnasios en Cabo.",
    getStartedToday: "Comenzar Hoy",
    
    // Footer
    terms: "Términos",
    privacy: "Privacidad",
    contact: "Contacto",
    
    // Auth Dialog
    authTitle: "Comenzar",
    email: "Correo Electrónico",
    password: "Contraseña",
    createAccount: "Crear Cuenta",
    creatingAccount: "Creando Cuenta...",
    
    // ARIA Labels
    ariaSignUp: "Registrarse en Cabo Fit Pass",
    ariaLearnMore: "Saber más sobre cómo funciona",
    ariaCloseDialog: "Cerrar diálogo",
    ariaTryDemo: "Probar el tablero de demostración",
    ariaFinalCta: "Comenzar con Cabo Fit Pass hoy"
  }
}
