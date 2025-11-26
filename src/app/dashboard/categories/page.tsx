import { auth } from "@/lib/auth/auth";
import { getCategoriesByTenant } from "@/lib/db/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Categorías</h2>
          <p className="mt-1 text-muted-foreground">Organiza tus productos en categorías</p>
        </div>
        <Link href="/dashboard/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>{categories.length} categorías en total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {parentCategories.map((category) => {
              const children = getCategoryChildren(category.id);
              return (
                <div key={category.id} className="space-y-1">
                  {/* Parent Category */}
                  <div className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-5 w-5 cursor-move text-muted-foreground" />
                      {category.image && (
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">Slug: /{category.slug}</p>
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
                          className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
                            {child.image && (
                              <div className="relative h-10 w-10 overflow-hidden rounded">
                                <Image
                                  src={child.image}
                                  alt={child.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{child.name}</p>
                              <p className="text-xs text-muted-foreground">Slug: /{child.slug}</p>
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
              <div className="py-12 text-center">
                <p className="mb-4 text-muted-foreground">No hay categorías creadas aún</p>
                <Link href="/dashboard/categories/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
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
          <p>• Arrastra las categorías para reordenarlas (próximamente)</p>
          <p>• Las subcategorías ayudan a organizar productos en grupos más específicos</p>
          <p>• Los slugs se generan automáticamente del nombre de la categoría</p>
          <p>• Cada categoría puede tener una imagen que se muestra en la tienda</p>
        </CardContent>
      </Card>
    </div>
  );
}
