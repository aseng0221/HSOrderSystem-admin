import {initializeApp} from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';

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

const imageMapping = {
  Americano:
    'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&w=800&q=60',
  Latte:
    'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=800&q=60',
  Mocha:
    'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=800&q=60',
  Espresso:
    'https://images.unsplash.com/photo-1510591509098-f4fdc631024b?auto=format&fit=crop&w=800&q=60',
  'Flat White':
    'https://images.unsplash.com/photo-1570968015849-0497e1ae73d2?auto=format&fit=crop&w=800&q=60',
  'Oolong Tea':
    'https://images.unsplash.com/photo-1597318181409-cf44d78a2348?auto=format&fit=crop&w=800&q=60',
  'Jasmine Green Tea':
    'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=800&q=60',
  'Genmaicha Tea':
    'https://images.unsplash.com/photo-1582733315328-84999c739dec?auto=format&fit=crop&w=800&q=60',
  'Bao Zhong Tea':
    'https://images.unsplash.com/photo-1594631252845-29fc4586d56c?auto=format&fit=crop&w=800&q=60',
  'Four Season Tea':
    'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=60',
  'Roti Canai':
    'https://images.unsplash.com/photo-1626132646529-50063753273c?auto=format&fit=crop&w=800&q=60',
  'Tuna Sandwich':
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=60',
  'French Fries':
    'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=60',
  'Orange Juice':
    'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=60',
};

async function enrichProducts() {
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);

  for (const productDoc of productSnapshot.docs) {
    const data = productDoc.data();
    const imageUrl = imageMapping[data.name];

    if (imageUrl) {
      console.log(`Updating ${data.name} with image...`);
      await updateDoc(doc(db, 'products', productDoc.id), {
        image: imageUrl,
      });
    } else {
      console.log(`No image mapping found for ${data.name}`);
    }
  }

  console.log('Enrichment complete!');
  process.exit(0);
}

enrichProducts().catch(err => {
  console.error(err);
  process.exit(1);
});
