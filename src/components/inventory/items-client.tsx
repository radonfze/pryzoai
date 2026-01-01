"use client"

import { useState, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { ItemFilters, ItemFilterValues } from "@/components/inventory/item-filters"
import { columns, Item } from "@/app/(dashboard)/inventory/items/columns"
import { deleteItemsAction } from "@/actions/inventory/delete-items"

interface Category {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

interface ItemsClientProps {
  items: Item[]
  categories: Category[]
  brands: Brand[]
}

export function ItemsClient({ items, categories, brands }: ItemsClientProps) {
  const [filters, setFilters] = useState<ItemFilterValues>({
    itemType: null,
    status: null,
    stockLevel: null,
    categoryId: null,
    brandId: null,
  })

  // Apply filters to data
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (filters.itemType && item.itemType !== filters.itemType) {
        return false
      }

      // Status filter
      if (filters.status) {
        const isActive = item.isActive
        if (filters.status === "active" && !isActive) return false
        if (filters.status === "inactive" && isActive) return false
      }

      // Stock Level filter
      if (filters.stockLevel && item.itemType !== "service") {
        const available = parseFloat(item.stockAvailable || "0")
        const reorderLevel = parseFloat(item.reorderLevel || "0")

        if (filters.stockLevel === "in_stock" && available <= 0) return false
        if (filters.stockLevel === "out_of_stock" && available > 0) return false
        if (filters.stockLevel === "low_stock" && (available <= 0 || available > reorderLevel)) return false
      }

      // Category filter
      if (filters.categoryId && item.category?.id !== filters.categoryId) {
        return false
      }

      // Brand filter
      if (filters.brandId && item.brand?.id !== filters.brandId) {
        return false
      }

      return true
    })
  }, [items, filters])

  return (
    <div className="space-y-4">
      {/* Advanced Filters */}
      <ItemFilters
        categories={categories}
        brands={brands}
        onFilterChange={setFilters}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        searchKey="name"
        placeholder="Search items..."
        onDelete={async (ids) => {
          await deleteItemsAction(ids)
        }}
      />
    </div>
  )
}
