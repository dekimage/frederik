"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    home: "Home",
    about: "About",
    shop: "Shop",
    cart: "Cart",
    privacyPolicy: "Privacy Policy",
    copyright: "Copyright",
    cookies: "Cookies",

    // Categories
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",

    // Home page
    heroTitle: "Welcome to Our Photography Shop",
    heroSubtitle: "Capturing moments, creating memories",
    introduction: "INTRODUCTION",
    introText1:
      "Passionate, bursting with creativity and with an eye for detail. That's how I would describe myself. With my professional drones, I am always looking for new ways to explore the world and capture it on film. This gives me the chance to create unique images from a perspective like you have never seen the world before.",
    introText2:
      "What started as a passion long ago, has now grown into a way of sharing the beauty of landscapes and cities around us with others. Whether it is a misty landscape or vibrant city, each image tells a special story and shows how beautiful our world really is.",
    introText3:
      "With my posters, printed on paper, canvas, wood or metal, I want to bring this world into your home and let you enjoy our environment seen from above.",
    signature: "Johannes Kort,\nWOLFSKIN Photography™",
    categories: "Categories",
    reels: "Reels",

    // Important Information
    importantInfo: "IMPORTANT INFORMATION",
    websiteInfo: "WEBSITE INFORMATION AND PLACING ORDERS",
    websiteInfoText:
      "On this website you will find several categories: spring, summer, fall and winter. Each category consists of several photos taken in a beautiful location around the world in the season the photo falls under. Scroll through the categories and view all photos in larger size by clicking on them. Found yourself a photo you would like to hang in your living room or bedroom as a poster? Just select the type of material you want the photo printed on, select the size of the item and place it in your shopping cart. Have you chosen all the items you want to order? Click on order and go through the steps there. We will take care of the rest and make sure the poster is printed on the chosen material, carefully packed and shipped to the address you provided.",
    delivery: "DELIVERY",
    deliveryText:
      "All orders come with additional information about when and where the photo was taken. In The Netherlands, posters are usually delivered within a few days after ordering them online. Do you live elsewhere in Europe, outside The Netherlands? In that case delivery may take a few days to about two weeks. Delivery outside Europe is also possible, but please understand the delivery might need a longer period then.",
    orderCancellation: "ORDER CANCELLATION AND RETURNS",
    orderCancellationText:
      "Do you still have doubts after your purchase? You can cancel an order within 24 hours and the full amount will be refunded to the account you paid the order with. An order placed 24 hours ago or longer, unfortunately cannot be cancelled. Returns are unfortunately not possible.",
    mounting: "MOUNTING OF THE POSTER",
    mountingText:
      "Mounting materials are not included and depend on the back wall on which the poster will be hung. Get information from your local hardware store and, if necessary, hire an expert to hang the poster for you.",

    // Legal Pages
    privacyPolicyTitle: "PRIVACY POLICY",
    privacyPolicyContent: `At https://www.wolfskinphotography.com, we place great value on your privacy. In this privacy policy, we explain what data we collect, why we collect it, and how we protect your data.

WHAT DATA DO WE COLLECT?
- Personal data: such as your name, email address, phone number and address, when you place an order or contact us;
- Usage data: such as your IP address, browser information and how you use our website (via cookies).

WHY DO WE COLLECT THIS DATA?
- To process and deliver your orders;
- To answer your questions or requests;
- To improve the website and make it more user-friendly;
- To keep you informed of offers or updates (only with your consent).

DO WE SHARE YOUR DATA?
We never share your data with third parties, unless this is necessary to:
- Process an order (for example with a delivery service);
- Comply with legal obligations.

HOW DO WE PROTECT YOUR DATA?
We take appropriate technical and organizational measures to protect your data against loss, theft or unauthorized access.

YOUR RIGHTS
You have the right to:
- View, correct or delete your data;
- Withdraw your consent for the use of your data.

COOKIES:
Our website uses cookies to improve usability. You can refuse cookies through your browser settings. Read more about this in our cookie policy at https://www.wolfskinphotography.com/cookies.

CONTACT
For questions about this privacy policy or your data, you can contact us at contact@wolfskinphotography.com.

Last updated: 01.02.2025`,

    copyrightTitle: "COPYRIGHT STATEMENT",
    copyrightContent: `The entire content of this website, including photos, text, images, logos and illustrations, is owned by WOLFSKIN Photography™ and protected by international intellectual property laws.

COPYRIGHT INFRINGEMENT
Unauthorized use, reproduction or distribution of our copyrighted material is strictly prohibited. We take copyright infringement extremely seriously and will take appropriate legal action to protect our rights.

USAGE PERMISSION
If you wish to use content from this website, please contact us at contact@wolfskinphotography.com to request permission. Proper attribution and a link back to our website are required if permission is granted.

INFRINGEMENT REPORTING
If you believe your copyrighted work is being used on this website without permission, please contact us at contact@wolfskinphotography.com with the following information:
- Your contact details;
- A description of the copyrighted work;
- A description of where the material is located on our website.`,

    cookiesTitle: "COOKIES",
    cookiesContent: `At https://www.wolfskinphotography.com we use cookies to improve your experience. In this policy we explain what cookies are, which cookies we use and how you can manage them.

WHAT ARE COOKIES?
Cookies are small text files that are stored on your device when you visit our website. They help us make the website work better and gain insight into how visitors use the site.

WHICH COOKIES DO WE USE?
We use the following types of cookies:
- Necessary cookies: these cookies are essential for the website to function properly, for example to place an order or log in;
- Functional cookies: these cookies remember your preferences, such as your language choice or shopping cart, making the website more user-friendly;
- Analytical cookies: we use analytical cookies to understand how visitors use our website. This helps us improve the website. For example, we use Google Analytics;
- Advertising and tracking cookies: with your consent, we may use cookies to tailor advertisements to your interests.

HOW CAN YOU MANAGE OR DELETE COOKIES?
You can manage or delete cookies through your browser settings. Please note that some functions of the website may not work properly if you disable cookies.

CHANGES TO THIS POLICY
We may update this cookie policy from time to time. Please check this page regularly for updates.

CONTACT
Do you have questions about our use of cookies? Please feel free to contact us at contact@wolfskinphotography.com.`,
  },

  nl: {
    // Navigation
    home: "Home",
    about: "Over",
    shop: "Winkel",
    cart: "Winkelwagen",
    privacyPolicy: "Privacybeleid",
    copyright: "Auteursrecht",
    cookies: "Cookies",

    // Categories
    spring: "Lente",
    summer: "Zomer",
    autumn: "Herfst",
    winter: "Winter",

    // Home page
    heroTitle: "Welkom bij Onze Fotografie Winkel",
    heroSubtitle: "Momenten vastleggen, herinneringen creëren",
    introduction: "INTRODUCTIE",
    introText1:
      "Gepassioneerd, boordevol creativiteit en met oog voor detail. Zo zou ik mijzelf omschrijven. Met mijn professionele drones ben ik altijd op zoek naar nieuwe manieren om de wereld te ontdekken en vast te leggen op de gevoelige plaat. Zo krijg ik de kans om unieke beelden te maken vanuit een perspectief zoals je de wereld nog nooit gezien hebt.",
    introText2:
      "Wat lang geleden begon als een passie, is inmiddels uitgegroeid tot een manier om de schoonheid van landschappen en steden om ons heen met anderen te delen. Of het nu gaat om een mistig landschap of bruisende stad, elk beeld vertelt een bijzonder verhaal en laat zien hoe prachtig onze wereld eigenlijk is.",
    introText3:
      "Met mijn posters, geprint op papier, canvas, hout of metaal, wil ik deze wereld bij jou thuis brengen en je laten genieten van onze omgeving van bovenaf gezien.",
    signature: "Johannes Kort,\nWOLFSKIN Photography™",
    categories: "Categorieën",
    reels: "Reels",

    // Important Information
    importantInfo: "BELANGRIJKE INFORMATIE",
    websiteInfo: "WEBSITE-INFORMATIE EN BESTELLINGEN PLAATSEN",
    websiteInfoText:
      "Op deze website vind je verschillende categorieën: lente, zomer, herfst en winter. Elke categorie bestaat uit meerdere foto's, gemaakt op een prachtige locatie in de wereld in het seizoen waar de foto onder valt. Scroll door de categorieën heen en bekijk alle foto's in groter formaat door er op te klikken. Zie je een foto die je als een poster in je huiskamer of slaapkamer aan de muur wilt hangen? Selecteer het soort materiaal waar je de foto op geprint wilt hebben, selecteer de grootte van het item en plaats het in je winkelmandje. Heb je alle items gekozen die je wilt bestellen? Klik op bestellen en doorloop de stappen. Wij regelen de rest en zorgen dat de poster op het gekozen materiaal wordt geprint, zorgvuldig wordt ingepakt en verstuurd naar het opgegeven adres.",
    delivery: "LEVERING",
    deliveryText:
      "Alle bestellingen worden geleverd met extra informatie over de locatie waar de foto is gemaakt en wanneer. Posters worden doorgaans na bestelling binnen enkele dagen in Nederland geleverd. Woon je elders in Europa? Dan kan de levering een aantal dagen tot ongeveer twee weken duren. Levering buiten Europa is ook mogelijk, houd dan rekening met een langere levertijd.",
    orderCancellation: "ANNULERING BESTELLING EN RETOURNEREN",
    orderCancellationText:
      "Heb je na je aankoop toch twijfels? Een annulering van een bestelling kan binnen 24 uur waarbij het volledige bedrag wordt teruggestort op de rekening waarmee betaald is. Is de bestelling inmiddels 24 uur geleden? Dan kan de bestelling helaas niet meer geannuleerd worden. Retourneren is helaas niet mogelijk.",
    mounting: "MONTAGE VAN DE POSTER",
    mountingText:
      "Montagemateriaal is exclusief en is afhankelijk van de achterwand waarop de poster komt te hangen. Laat je wat betreft montage informeren bij je lokale bouwmarkt en schakel desnoods een expert in bij het ophangen van de poster.",

    // Legal Pages
    privacyPolicyTitle: "PRIVACY POLICY",
    privacyPolicyContent: `Bij https://www.wolfskinphotography.com hechten we veel waarde aan jouw privacy. In dit privacybeleid leggen we uit welke gegevens we verzamelen, waarom we deze verzamelen en hoe we jouw gegevens beschermen.

WELKE GEGEVENS VERZAMELEN WE?
- Persoonlijke gegevens: zoals je naam, e-mailadres, telefoonnummer en adres, wanneer je een bestelling plaatst of contact met ons opneemt;
- Gebruiksgegevens: zoals je IP-adres, browserinformatie en hoe je onze website gebruikt (via cookies).

WAAROM VERZAMELEN WE DEZE GEGEVENS?
- Om jouw bestellingen te kunnen verwerken en bezorgen;
- Om je vragen of verzoeken te beantwoorden;
- Om de website te verbeteren en gebruiksvriendelijker te maken;
- Om je op de hoogte te houden van aanbiedingen of updates (alleen met jouw toestemming).

DELEN WE JOUW GEGEVENS?
We delen jouw gegevens nooit met derden, tenzij dit nodig is om:
- Een bestelling te verwerken (bijvoorbeeld met een bezorgdienst);
- Te voldoen aan wettelijke verplichtingen.

HOE BESCHERMEN WE JOUW GEGEVENS?
We nemen passende technische en organisatorische maatregelen om jouw gegevens te beschermen tegen verlies, diefstal of ongeoorloofde toegang.

JOUW RECHTEN
Je hebt het recht om:
- Je gegevens in te zien, te corrigeren of te laten verwijderen;
- Je toestemming voor het gebruik van je gegevens in te trekken.

COOKIES:
Onze website maakt gebruik van cookies om het gebruiksgemak te verbeteren. Je kunt cookies weigeren via de instellingen van je browser. Lees er meer over in ons cookiesbeleid op https://www.wolfskinphotography.com/cookies.

CONTACT
Voor vragen over dit privacybeleid of jouw gegevens kun je contact met ons opnemen via contact@wolfskinphotography.com.

Laatst bijgewerkt: 01.02.2025`,

    copyrightTitle: "COPYRIGHT STATEMENT",
    copyrightContent: `De volledige inhoud van deze website, inclusief foto's, tekst, afbeeldingen, logo's en afbeeldingen, is eigendom van WOLFSKIN Photography™ en beschermd door de internationale wetgeving inzake intellectuele eigendommen.

INBREUK OP AUTEURSRECHT
Ongeautoriseerd gebruik, reproductie of distributie van ons auteursrechtelijk beschermde materiaal is strikt verboden. Wij nemen inbreuk op auteursrechten uiterst serieus en zullen passende juridische stappen ondernemen om onze rechten te beschermen.

GEBRUIKSTOESTEMMING
Als u inhoud van deze website wilt gebruiken, neem dan contact met ons op via contact@wolfskinphotography.com om toestemming te vragen. Correcte vermelding en een link terug naar onze website zijn vereist als toestemming wordt verleend.

MELDING VAN INBREUK
Als u denkt dat uw auteursrechtelijk beschermde werk zonder toestemming op deze website wordt gebruikt, neem dan contact met ons op via contact@wolfskinphotography.com, met de volgende informatie:
- Uw contactgegevens;
- Een beschrijving van het auteursrechtelijk beschermde werk;
- Een beschrijving van waar het materiaal zich op onze website bevindt.`,

    cookiesTitle: "COOKIES",
    cookiesContent: `Op https://www.wolfskinphotography.com maken we gebruik van cookies om jouw ervaring te verbeteren. In dit beleid leggen we uit wat cookies zijn, welke cookies we gebruiken en hoe je ze kunt beheren.

WAT ZIJN COOKIES?
Cookies zijn kleine tekstbestanden die worden opgeslagen op jouw apparaat wanneer je onze website bezoekt. Ze helpen ons om de website beter te laten werken en om inzicht te krijgen in hoe bezoekers de site gebruiken.

WELKE COOKIES GEBRUIKEN WE?
We gebruiken de volgende soorten cookies:
- Noodzakelijke cookies: deze cookies zijn essentieel om de website goed te laten functioneren, bijvoorbeeld om een bestelling te plaatsen of in te loggen;
- Functionele cookies: deze cookies onthouden jouw voorkeuren, zoals je taalkeuze of winkelmandje, zodat de website gebruiksvriendelijker is;
- Analytische cookies: we gebruiken analytische cookies om te begrijpen hoe bezoekers onze website gebruiken. Dit helpt ons de website te verbeteren. We maken bijvoorbeeld gebruik van Google Analytics;
- Advertentie- en trackingcookies: met jouw toestemming kunnen we cookies gebruiken om advertenties aan te passen aan jouw interesses.

HOE KUN JE COOKIES BEHEREN OF VERWIJDEREN?
Je kunt cookies beheren of verwijderen via de instellingen van jouw browser. Houd er rekening mee dat sommige functies van de website mogelijk niet goed werken als je cookies uitschakelt.

WIJZIGINGEN IN DIT BELEID
We kunnen dit cookiesbeleid van tijd tot tijd aanpassen. Controleer deze pagina regelmatig voor updates.

CONTACT
Heb je vragen over ons gebruik van cookies? Neem gerust contact met ons op via contact@wolfskinphotography.com.`,
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "nl")) {
      setLanguage(savedLanguage);
    }
    setIsLoading(false);
  }, []);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
