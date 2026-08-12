/* =========================================================
   ROYAL ORBITECH — CATALOGUE PRODUITS
   ---------------------------------------------------------
   COMMENT MODIFIER :
   - Chaque produit est un objet { ... } séparé par une virgule.
   - name/desc : { fr:"...", en:"..." }  (textes bilingues)
   - cat   : doit correspondre à une clé de CATEGORIES ci-dessous
   - price : prix en FCFA (nombre entier, sans espaces)
   - old   : ancien prix barré (optionnel, mettez 0 si aucun)
   - img   : nom du fichier image dans images/products/
             (si l'image manque, une icône s'affiche automatiquement)
   - badge : "promo" | "new" | "top" | "" (optionnel)
   - rating: note sur 5   |   sold: nombre de ventes
   ========================================================= */

const CATEGORIES = [
  { key: 'all',        emoji: '🛍️', fr: 'Tous les produits', en: 'All products' },
  { key: 'phones',     emoji: '📱', fr: 'Téléphones',        en: 'Phones' },
  { key: 'computers',  emoji: '💻', fr: 'Ordinateurs',       en: 'Computers' },
  { key: 'audio',      emoji: '🎧', fr: 'Audio',             en: 'Audio' },
  { key: 'accessories',emoji: '🔌', fr: 'Accessoires',       en: 'Accessories' },
  { key: 'smart',      emoji: '🏠', fr: 'Objets connectés',  en: 'Smart Home' },
  { key: 'gaming',     emoji: '🎮', fr: 'Gaming',            en: 'Gaming' },
  { key: 'appliances', emoji: '🍳', fr: 'Électroménager',    en: 'Appliances' },
  { key: 'network',    emoji: '📡', fr: 'Réseaux',           en: 'Networking' }
];

const PRODUCTS = [
  { id: 1,  cat: 'phones', img: 'smartphone-pro.svg', price: 485000, old: 560000, badge: 'promo', rating: 4.8, sold: 1240,
    name: { fr: 'Smartphone Pro 5G 256 Go', en: 'Pro 5G Smartphone 256GB' },
    desc: { fr: 'Écran AMOLED 6,7", triple caméra 108 MP, batterie 5000 mAh, charge rapide.', en: '6.7" AMOLED display, 108MP triple camera, 5000mAh battery, fast charging.' } },
  { id: 2,  cat: 'phones', img: 'smartphone-lite.svg', price: 215000, old: 0, badge: 'new', rating: 4.5, sold: 860,
    name: { fr: 'Smartphone Lite 128 Go', en: 'Lite Smartphone 128GB' },
    desc: { fr: 'Idéal au quotidien : grand écran, double SIM, autonomie 2 jours.', en: 'Perfect for daily use: large screen, dual SIM, 2-day battery life.' } },
  { id: 3,  cat: 'computers', img: 'laptop-ultra.svg', price: 720000, old: 820000, badge: 'top', rating: 4.9, sold: 540,
    name: { fr: 'Ordinateur portable Ultra 16 Go', en: 'Ultra Laptop 16GB' },
    desc: { fr: 'Processeur dernière génération, SSD 512 Go, écran 15,6" Full HD.', en: 'Latest-gen processor, 512GB SSD, 15.6" Full HD display.' } },
  { id: 4,  cat: 'computers', img: 'laptop-business.svg', price: 545000, old: 0, badge: '', rating: 4.6, sold: 410,
    name: { fr: 'PC Portable Business 8 Go', en: 'Business Laptop 8GB' },
    desc: { fr: 'Léger et performant, parfait pour le travail et les études.', en: 'Light and powerful, perfect for work and study.' } },
  { id: 5,  cat: 'computers', img: 'desktop-pro.svg', price: 950000, old: 1090000, badge: 'promo', rating: 4.7, sold: 220,
    name: { fr: 'PC Bureau Pro + Écran 24"', en: 'Pro Desktop + 24" Monitor' },
    desc: { fr: 'Station complète pour bureautique, design et création.', en: 'Complete workstation for office, design and creation.' } },
  { id: 6,  cat: 'audio', img: 'earbuds.svg', price: 45000, old: 65000, badge: 'promo', rating: 4.6, sold: 3120,
    name: { fr: 'Écouteurs sans fil ANC', en: 'Wireless Earbuds ANC' },
    desc: { fr: 'Réduction de bruit active, son immersif, 30 h d\'autonomie.', en: 'Active noise cancelling, immersive sound, 30h battery.' } },
  { id: 7,  cat: 'audio', img: 'headphones.svg', price: 78000, old: 0, badge: 'top', rating: 4.8, sold: 1450,
    name: { fr: 'Casque Bluetooth Premium', en: 'Premium Bluetooth Headset' },
    desc: { fr: 'Confort exceptionnel, basses puissantes, micro intégré.', en: 'Exceptional comfort, powerful bass, built-in mic.' } },
  { id: 8,  cat: 'audio', img: 'speaker.svg', price: 62000, old: 75000, badge: '', rating: 4.5, sold: 980,
    name: { fr: 'Enceinte Bluetooth Étanche', en: 'Waterproof Bluetooth Speaker' },
    desc: { fr: 'Son 360°, étanche IPX7, idéale intérieur et extérieur.', en: '360° sound, IPX7 waterproof, great indoors and outdoors.' } },
  { id: 9,  cat: 'smart', img: 'smartwatch.svg', price: 89000, old: 120000, badge: 'promo', rating: 4.7, sold: 2050,
    name: { fr: 'Montre connectée Sport', en: 'Sport Smartwatch' },
    desc: { fr: 'Fréquence cardiaque, GPS, notifications, étanche.', en: 'Heart rate, GPS, notifications, water resistant.' } },
  { id: 10, cat: 'smart', img: 'camera-security.svg', price: 55000, old: 0, badge: 'new', rating: 4.4, sold: 670,
    name: { fr: 'Caméra de surveillance WiFi', en: 'WiFi Security Camera' },
    desc: { fr: 'Vision nocturne, détection de mouvement, contrôle via smartphone.', en: 'Night vision, motion detection, smartphone control.' } },
  { id: 11, cat: 'smart', img: 'smart-bulb.svg', price: 12000, old: 18000, badge: 'promo', rating: 4.3, sold: 1890,
    name: { fr: 'Ampoule connectée RGB', en: 'Smart RGB Bulb' },
    desc: { fr: '16 millions de couleurs, pilotable à la voix et à distance.', en: '16 million colors, voice and remote control.' } },
  { id: 12, cat: 'accessories', img: 'powerbank.svg', price: 22000, old: 30000, badge: 'promo', rating: 4.6, sold: 4210,
    name: { fr: 'Batterie externe 20 000 mAh', en: 'Power Bank 20000mAh' },
    desc: { fr: 'Charge rapide, double USB + USB-C, recharge plusieurs fois.', en: 'Fast charge, dual USB + USB-C, multiple recharges.' } },
  { id: 13, cat: 'accessories', img: 'charger.svg', price: 15000, old: 0, badge: '', rating: 4.5, sold: 2600,
    name: { fr: 'Chargeur rapide 65 W GaN', en: '65W GaN Fast Charger' },
    desc: { fr: 'Compact et puissant, compatible ordinateurs et téléphones.', en: 'Compact and powerful, works with laptops and phones.' } },
  { id: 14, cat: 'accessories', img: 'usb-hub.svg', price: 28000, old: 35000, badge: '', rating: 4.4, sold: 720,
    name: { fr: 'Hub USB-C 7-en-1', en: '7-in-1 USB-C Hub' },
    desc: { fr: 'HDMI 4K, lecteur SD, 3 ports USB, idéal pour ordinateurs portables.', en: '4K HDMI, SD reader, 3 USB ports, ideal for laptops.' } },
  { id: 15, cat: 'gaming', img: 'gaming-mouse.svg', price: 32000, old: 42000, badge: 'promo', rating: 4.7, sold: 1560,
    name: { fr: 'Souris Gaming RGB', en: 'RGB Gaming Mouse' },
    desc: { fr: 'Capteur haute précision, 7 boutons programmables, éclairage RGB.', en: 'High-precision sensor, 7 programmable buttons, RGB lighting.' } },
  { id: 16, cat: 'gaming', img: 'gaming-keyboard.svg', price: 48000, old: 0, badge: 'top', rating: 4.8, sold: 940,
    name: { fr: 'Clavier Mécanique Gaming', en: 'Mechanical Gaming Keyboard' },
    desc: { fr: 'Switches réactifs, rétroéclairage RGB, structure robuste.', en: 'Responsive switches, RGB backlight, sturdy build.' } },
  { id: 17, cat: 'gaming', img: 'controller.svg', price: 38000, old: 45000, badge: '', rating: 4.6, sold: 1120,
    name: { fr: 'Manette de jeu sans fil', en: 'Wireless Game Controller' },
    desc: { fr: 'Compatible PC et consoles, ergonomique, retour vibratoire.', en: 'PC and console compatible, ergonomic, vibration feedback.' } },
  { id: 18, cat: 'appliances', img: 'blender.svg', price: 42000, old: 55000, badge: 'promo', rating: 4.5, sold: 830,
    name: { fr: 'Blender Multifonction 1000 W', en: 'Multifunction Blender 1000W' },
    desc: { fr: 'Puissant, plusieurs vitesses, bol en verre résistant.', en: 'Powerful, multiple speeds, durable glass jar.' } },
  { id: 19, cat: 'appliances', img: 'airfryer.svg', price: 68000, old: 85000, badge: 'top', rating: 4.7, sold: 1340,
    name: { fr: 'Friteuse sans huile 5 L', en: 'Air Fryer 5L' },
    desc: { fr: 'Cuisson saine sans huile, écran tactile, grande capacité.', en: 'Healthy oil-free cooking, touch screen, large capacity.' } },
  { id: 20, cat: 'network', img: 'router.svg', price: 58000, old: 0, badge: 'new', rating: 4.6, sold: 610,
    name: { fr: 'Routeur WiFi 6 Haut Débit', en: 'WiFi 6 High-Speed Router' },
    desc: { fr: 'Couverture étendue, connexion stable pour toute la maison ou le bureau.', en: 'Wide coverage, stable connection for home or office.' } },
  { id: 21, cat: 'network', img: 'repeater.svg', price: 24000, old: 32000, badge: 'promo', rating: 4.3, sold: 1470,
    name: { fr: 'Répéteur WiFi Amplificateur', en: 'WiFi Range Extender' },
    desc: { fr: 'Éliminez les zones sans signal, installation en 1 minute.', en: 'Eliminate dead zones, 1-minute setup.' } },
  { id: 22, cat: 'computers', img: 'monitor.svg', price: 165000, old: 195000, badge: '', rating: 4.7, sold: 380,
    name: { fr: 'Écran 27" 2K 144 Hz', en: '27" 2K 144Hz Monitor' },
    desc: { fr: 'Dalle nette, fluide et immersive pour travail et gaming.', en: 'Sharp, smooth and immersive panel for work and gaming.' } }
];
