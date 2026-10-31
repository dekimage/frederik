import { firestore, FieldValue } from "@/app/firebaseAdmin";
import { withAdminRoute } from "@/lib/withAdminRoute";

export async function PUT(request, context) {
  return withAdminRoute(request, async () => {
    try {
      const { id } = await context.params;
      const body = await request.json();
      const name = String(body.name || "").trim();
      if (!name || name.length > 60) {
        return Response.json(
          { error: "Category name must be between 1 and 60 characters." },
          { status: 400 },
        );
      }

      const categoryRef = firestore.collection("categories").doc(id);
      const [category, allCategories] = await Promise.all([
        categoryRef.get(),
        firestore.collection("categories").get(),
      ]);
      if (!category.exists) {
        return Response.json({ error: "Category not found." }, { status: 404 });
      }

      const duplicate = allCategories.docs.some(
        (doc) =>
          doc.id !== id &&
          String(doc.data().name || "")
            .trim()
            .toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) {
        return Response.json(
          { error: "A category with this name already exists." },
          { status: 409 },
        );
      }

      // Normalize legacy name-based references to the stable category ID on rename.
      const aliases = [
        ...new Set(
          [
            id,
            category.data().name,
            String(category.data().name || "").toLowerCase(),
          ].filter(Boolean),
        ),
      ];
      for (const collectionName of ["products", "images"]) {
        const linked = await firestore
          .collection(collectionName)
          .where("category", "in", aliases)
          .get();
        for (let start = 0; start < linked.docs.length; start += 400) {
          const batch = firestore.batch();
          linked.docs
            .slice(start, start + 400)
            .forEach((doc) => batch.update(doc.ref, { category: id }));
          await batch.commit();
        }
      }
      await categoryRef.update({
        name,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return Response.json({ success: true, id, name });
    } catch (error) {
      console.error("Error renaming category:", error);
      return Response.json(
        { error: "Unable to rename category." },
        { status: 500 },
      );
    }
  });
}

export async function DELETE(request, context) {
  return withAdminRoute(request, async () => {
    try {
      const { id } = await context.params;
      const category = await firestore.collection("categories").doc(id).get();
      const aliases = [
        ...new Set(
          [
            id,
            category.data()?.name,
            category.data()?.name?.toLowerCase(),
          ].filter(Boolean),
        ),
      ];
      const [products, images] = await Promise.all([
        firestore.collection("products").where("category", "in", aliases).get(),
        firestore.collection("images").where("category", "in", aliases).get(),
      ]);

      if (!products.empty || !images.empty) {
        return Response.json(
          {
            error: `This category is still used by ${products.size} product(s) and ${images.size} image(s). Reassign them before deleting it.`,
          },
          { status: 409 },
        );
      }

      await firestore.collection("categories").doc(id).delete();
      return Response.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}
