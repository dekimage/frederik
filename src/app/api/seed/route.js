import { firestore } from "@/app/firebaseAdmin";
import { NextResponse } from "next/server";

// IN BROWSER CONSOLE ->
// fetch('/api/seed', {
//   method: 'POST',
// }).then(res => res.json()).then(console.log).catch(console.error);

export async function POST() {
  // Sample product data
  const products = [
    {
      name: "Canvas Print - Sunset",
      price: 50, // In euros
      image: "https://picsum.photos/600/400?random=1",
      description: "A beautiful canvas print of a sunset.",
      category: "Canvas Prints",
    },
    {
      name: "Framed Art - Mountains",
      price: 80, // In euros
      image: "https://picsum.photos/600/400?random=2",
      description: "Framed art depicting scenic mountain landscapes.",
      category: "Framed Art",
    },
    {
      name: "Digital Art - Abstract",
      price: 30, // In euros
      image: "https://picsum.photos/600/400?random=3",
      description: "Abstract digital art in vibrant colors.",
      category: "Digital Art",
    },
  ];

  try {
    const batch = firestore.batch(); // Initialize a Firestore batch operation

    products.forEach((product) => {
      const docRef = firestore.collection("products").doc(); // Create a new document with auto-generated ID
      batch.set(docRef, product); // Add the product to the batch
    });

    await batch.commit(); // Commit the batch operation
    return NextResponse.json({ message: "Products seeded successfully!" });
  } catch (error) {
    console.log("Error seeding products:", error);
    return NextResponse.json(
      { error: "Failed to seed products" },
      { status: 500 }
    );
  }
}
