import { auth } from "@/lib/auth/auth";
import { getCategoriesByTenant } from "@/lib/db/categories";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>;
  }

  const categories = await getCategoriesByTenant(session.user.tenantId);

  // Organize categories into parent-child structure
  const parentCategories = categories.filter((cat) => !cat.parentId);
  const getCategoryChildren = (parentId: string) =>
    categories.filter((cat) => cat.parentId === parentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">Categorías</h2>
          <p className="text-muted-foreground mt-1">
            Organiza tus productos en categorías
          </p>
        </div>
        <Link href="/dashboard/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>
            {categories.length} categorías en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {parentCategories.map((category) => {
              const children = getCategoryChildren(category.id);
              return (
                <div key={category.id} className="space-y-1">
                  {/* Parent Category */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      {category.imageUrl && (
                        <div className="relative h-12 w-12 rounded overflow-hidden">
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-lg">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Slug: /{category.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/categories/${category.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Child Categories */}
                  {children.length > 0 && (
                    <div className="ml-8 space-y-1">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            {child.imageUrl && (
                              <div className="relative h-10 w-10 rounded overflow-hidden">
                                <Image
                                  src={child.imageUrl}
                                  alt={child.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{child.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Slug: /{child.slug}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/categories/${child.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {categories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No hay categorías creadas aún
                </p>
                <Link href="/dashboard/categories/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Categoría
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consejos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Arrastra las categorías para reordenarlas (próximamente)
          </p>
          <p>
            • Las subcategorías ayudan a organizar productos en grupos más
            específicos
          </p>
          <p>• Los slugs se generan automáticamente del nombre de la categoría</p>
          <p>
            • Cada categoría puede tener una imagen que se muestra en la tienda
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
