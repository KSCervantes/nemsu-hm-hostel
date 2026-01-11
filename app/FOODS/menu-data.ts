export type MenuItem = {
  id: number;
  name: string;
  price: number;
  description: string;
  img: string;
  category: "main" | "snacks" | "desserts" | "drinks";
  code: string;
};

export const menuItems: MenuItem[] = [
  // MAIN DISHES
  { id: 1, name: "CHICKEN & PORK SHASHLIK (2 PCS)", price: 120, description: "CHICKEN AND PORK SHASHLIK IS A GREAT WAY TO KICK YOUR CHICKEN TIKKA UP A BIG NOTCH. TANDOORI CHICKEN AND PORK ON A BED OF INDIAN SPICED ONION, GREEN AND RED PEPPER.", img: "/img/chicken-pork-shashlik-2pcs.webp", category: "main", code: "M1" },
  { id: 2, name: "HAINANESE PORK CHOP", price: 130, description: "SINGAPOREAN DISH, RECIPE USING CREAM CRACKERS TO GIVE THE PORK CHOPS A UNIQUE CRUNCH AND FLAVOUR. TOPPED WITH A SAVOURY SAUCE WITH SLICED POTATOES, PEAS, ONIONS AND CARROTS.", img: "/img/hainanese-pork-chop.webp", category: "main", code: "M2" },
  { id: 3, name: "CREAMY TUSCAN CHICKEN", price: 140, description: "FEATURES TENDER CHICKEN BREASTS, SUN-DRIED TOMATOES, SPINACH, GARLIC AND MORE ALL IN THE BEST PARMESAN CREAM SAUCE", img: "/img/creamy-tuscan-chicken.webp", category: "main", code: "M3" },
  { id: 4, name: "BIBIMBAP", price: 160, description: "A KOREAN RICE DISH, THE TERM BIBIM MEANS 'MIXING' AND BAP IS COOKED RICE. IT IS SERVED AS A BOWL OF WARM WHITE RICE TOPPED WITH NAMUL AND GOCHUJANG, EGG AND SLICED MEAT.", img: "/img/bibimbap.webp", category: "main", code: "M4" },

  // SNACKS
  { id: 5, name: "UBE MALAGKIT TURON WITH CHEESE (3PCS)", price: 35, description: "UBE MALAGKIT AND CHEDDAR CHEESE WRAPPED LIKE A SPRING ROLL AND FRIED UNTIL CRISPY", img: "/img/ube-malagkit-turon-cheese-3pcs.webp", category: "snacks", code: "S1" },
  { id: 6, name: "PINSEC FRITO (4 PCS)", price: 45, description: "DISH THAT RESEMBLES THE ALL-TIME FAVORITE FILIPINO CHINESE DIMSUM, PORK SIOMAI. PINSEC FRITO IS FRIED UNTIL THE WRAPPER TURNS CRISPY AND GOLDEN BROWN IN COLOR.", img: "/img/pinsec-frito-4pcs.webp", category: "snacks", code: "S2" },
  { id: 7, name: "TSUKUNE (4 PCS)", price: 60, description: "TSUKUNE ARE FRIED JAPANESE PORK MEATBALL, GLAZED IN A DELICIOUS SWEET SAVORY SAUCE.", img: "/img/tsukune-4pcs.webp", category: "snacks", code: "S3" },
  { id: 8, name: "CHEESY TAKOYAKI PIZZA (3 PCS) BITE SIZE", price: 80, description: "MADE OF A WHEAT FLOUR BATTER AND COOKED IN AN AIR FRYER, IT IS FILLED WITH MOZZARELLA, DICED SHRIMP, TEMPURA SCRAPS, AND GREEN ONION DRIZZLED WITH JAPANESE MAYONNAISE.", img: "/img/cheesy-takoyaki-pizza-3pcs-bitesize.webp", category: "snacks", code: "S4" },
  { id: 9, name: "MOZZARELLA STICK (4PCS)", price: 80, description: "CRISPY PIZZA TOPPED WITH A FLAVOR PACKED MIXTURE OF MINCED MEAT WITH PEPPERS, TOMATO, FRESH HERBS AND EARTHY SPICES.", img: "/img/mozzarella-stick-4pcs.webp", category: "snacks", code: "S5" },

  // DESSERTS/SWEETS
  { id: 10, name: "MINI BLAZED DONUTS (4 PCS)", price: 50, description: "BAKED AND COATED IN CINNAMON AND SUGAR ARE A LIGHTER AND EQUALLY DELICIOUS TASTE WITH NUMEROUS", img: "/img/mini-blazed-donuts-4pcs.webp", category: "desserts", code: "D1" },
  { id: 11, name: "CHE CHUOI", price: 55, description: "VIETNAMESE PUDDING-LIKE DESSERT FEATURING BANANAS, AND RICH COCONUT CREAM.", img: "/img/che-chuoi.webp", category: "desserts", code: "D2" },
  { id: 12, name: "MANGO STICKY RICE", price: 65, description: "CLASSIC THAI DESSERT THAT'S EASY TO MAKE AT HOME WITH STICKY WHITE RICE, A SWEET COCONUT SAUCE, AND SLICES OF FRESH MANGO.", img: "/img/mango-sticky-rice.webp", category: "desserts", code: "D3" },

  // DRINKS - SPECIAL ICE COFFEE
  { id: 13, name: "ICE MATCHA CREAM", price: 65, description: "A STRONG, ICED MATCHA LATTE TOPPED WITH A THICK LAYER OF WHIPPED CREAM.", img: "/img/ice-matcha-cream.webp", category: "drinks", code: "C1" },
  { id: 14, name: "ICE DOUBLE CHOCOLATE CREAM", price: 70, description: "DARK CHOCOLATE TOPPED WITH WHIPPED CREAM AND CHOCOLATE SYRUP", img: "/img/ice-double-chocolate-cream.webp", category: "drinks", code: "C2" },

  // DRINKS - REFRESHING DRINKS
  { id: 15, name: "FOUR SEASONS", price: 30, description: "REFRESHING DRINK SOURCE OF 100% VITAMIN C. EVERY SIP MAKES IT A PERFECT PAIR FOR EVERY MEAL.", img: "/img/four-seasons.webp", category: "drinks", code: "R1" },
  { id: 16, name: "LEMON ICE TEA", price: 30, description: "REFRESHING DRINK LEMON ICED TEA WITH SUGAR, LEMON.", img: "/img/lemon-ice-tea.webp", category: "drinks", code: "R2" }
];
