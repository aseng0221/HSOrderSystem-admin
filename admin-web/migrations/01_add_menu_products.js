import {initializeApp} from 'firebase/app';
import {getFirestore, collection, addDoc, getDocs} from 'firebase/firestore';

// In a real application, configuration should come from environment variables.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addMissing() {
  const catsCol = collection(db, 'categories');
  const catSnapshot = await getDocs(catsCol);

  let othersCategoryId = null;
  let classicCategoryId = null;
  let teaCategoryId = null;

  for (const doc of catSnapshot.docs) {
    const data = doc.data();
    if (data.name === 'Others') {
      othersCategoryId = doc.id;
    } else if (data.name === 'Classic') {
      classicCategoryId = doc.id;
    } else if (data.name === 'Tea') {
      teaCategoryId = doc.id;
    }
  }

  if (!classicCategoryId) {
    console.error('Classic category not found, cannot add Coffee products.');
    process.exit(1);
  }
  if (!teaCategoryId) {
    console.error('Tea category not found, cannot add Tea products.');
    process.exit(1);
  }

  if (!othersCategoryId) {
    const docRef = await addDoc(catsCol, { name: 'Others', order: 4, disabled: false });
    othersCategoryId = docRef.id;
    console.log('Created Others category with ID:', othersCategoryId);
  } else {
    console.log('Others category already exists with ID:', othersCategoryId);
  }

  const productsCol = collection(db, 'products');
  const existingProductsSnapshot = await getDocs(productsCol);
  const existingProductNames = new Set(existingProductsSnapshot.docs.map(doc => doc.data().name));

  const newProducts = [
    {
      name: 'Espresso',
      categoryId: classicCategoryId,
      price: 'RM 4.90',
      description: '',
      disabled: false,
      tag: '',
      order: 4,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Spanish Latte',
      categoryId: classicCategoryId,
      price: 'RM 8.90',
      description: '',
      disabled: false,
      tag: '',
      order: 5,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Coconut Latte',
      categoryId: classicCategoryId,
      price: 'RM 8.90',
      description: '',
      disabled: false,
      tag: '',
      order: 6,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Matcha Latte',
      categoryId: othersCategoryId,
      price: 'RM 8.90',
      description: '',
      disabled: false,
      tag: '',
      order: 1,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Signature Chocolate',
      categoryId: othersCategoryId,
      price: 'RM 8.90',
      description: '',
      disabled: false,
      tag: '',
      order: 2,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Iced Lemon Tea',
      categoryId: othersCategoryId,
      price: 'RM 3.90',
      description: '',
      disabled: false,
      tag: '',
      order: 3,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Iced Lemonade',
      categoryId: othersCategoryId,
      price: 'RM 3.90',
      description: '',
      disabled: false,
      tag: '',
      order: 4,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Classic Black Tea',
      categoryId: teaCategoryId,
      price: 'RM 3.90',
      description: '',
      disabled: false,
      tag: '',
      order: 1,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Jasmine Green Tea',
      categoryId: teaCategoryId,
      price: 'RM 3.90',
      description: '',
      disabled: false,
      tag: '',
      order: 2,
      globalOptions: [],
      image: ''
    },
    {
      name: 'Honey Green Tea',
      categoryId: teaCategoryId,
      price: 'RM 4.90',
      description: '',
      disabled: false,
      tag: '',
      order: 3,
      globalOptions: [],
      image: ''
    }
  ];

  for (const p of newProducts) {
    if (!existingProductNames.has(p.name)) {
      const docRef = await addDoc(productsCol, p);
      console.log(`Added ${p.name} with ID: ${docRef.id}`);
    } else {
      console.log(`Skipped ${p.name}, already exists.`);
    }
  }
  process.exit(0);
}

addMissing().catch(err => {
  console.error(err);
  process.exit(1);
});
