// Internationalization configuration and translations

export type Language = 'en' | 'ar' | 'fr';

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    tickets: 'Tickets',
    customers: 'Customers',
    inventory: 'Inventory',
    settings: 'Settings',
    logout: 'Logout',
    profile: 'Profile',
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    // Dashboard
    activeTickets: 'Active Tickets',
    totalCustomers: 'Total Customers',
    lowStockItems: 'Low Stock Items',
    totalRevenue: 'Total Revenue',
    // Tickets
    createTicket: 'Create Ticket',
    ticketNumber: 'Ticket #',
    status: 'Status',
    priority: 'Priority',
    // Settings
    generalSettings: 'General Settings',
    companyName: 'Company Name',
    companyEmail: 'Company Email',
    companyPhone: 'Company Phone',
    companyAddress: 'Company Address',
    currency: 'Currency',
    country: 'Country',
    language: 'Language',
  },
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    tickets: 'التذاكر',
    customers: 'العملاء',
    inventory: 'المخزون',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    profile: 'الملف الشخصي',
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    create: 'إنشاء',
    search: 'بحث',
    filter: 'تصفية',
    // Dashboard
    activeTickets: 'التذاكر النشطة',
    totalCustomers: 'إجمالي العملاء',
    lowStockItems: 'عناصر المخزون المنخفض',
    totalRevenue: 'إجمالي الإيرادات',
    // Tickets
    createTicket: 'إنشاء تذكرة',
    ticketNumber: 'رقم التذكرة',
    status: 'الحالة',
    priority: 'الأولوية',
    // Settings
    generalSettings: 'الإعدادات العامة',
    companyName: 'اسم الشركة',
    companyEmail: 'بريد الشركة الإلكتروني',
    companyPhone: 'هاتف الشركة',
    companyAddress: 'عنوان الشركة',
    currency: 'العملة',
    country: 'البلد',
    language: 'اللغة',
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    tickets: 'Tickets',
    customers: 'Clients',
    inventory: 'Inventaire',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    profile: 'Profil',
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    create: 'Créer',
    search: 'Rechercher',
    filter: 'Filtrer',
    // Dashboard
    activeTickets: 'Tickets actifs',
    totalCustomers: 'Total des clients',
    lowStockItems: 'Articles en stock faible',
    totalRevenue: 'Revenu total',
    // Tickets
    createTicket: 'Créer un ticket',
    ticketNumber: 'Numéro de ticket',
    status: 'Statut',
    priority: 'Priorité',
    // Settings
    generalSettings: 'Paramètres généraux',
    companyName: 'Nom de l\'entreprise',
    companyEmail: 'Email de l\'entreprise',
    companyPhone: 'Téléphone de l\'entreprise',
    companyAddress: 'Adresse de l\'entreprise',
    currency: 'Devise',
    country: 'Pays',
    language: 'Langue',
  },
};

export function getTranslation(key: string, lang: Language = 'en'): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

