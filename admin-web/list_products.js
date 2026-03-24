import {initializeApp} from 'firebase/app';
import {getFirestore, collection, getDocs} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCmJUundZ9xZRd5BgoIxr1uRdIgwRXI-4A',
  authDomain: 'hsordersystem.firebaseapp.com',
  projectId: 'hsordersystem',
  storageBucket: 'hsordersystem.firebasestorage.app',
  messagingSenderId: '997148333257',
  appId: '1:997148333257:web:d5670e682d4438bf14a918',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listProducts() {
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);
  const productList = productSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
  }));
  console.log(JSON.stringify(productList, null, 2));
  process.exit(0);
}

listProducts().catch(err => {
  console.error(err);
  process.exit(1);
});
