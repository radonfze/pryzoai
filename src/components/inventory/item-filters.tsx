"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Filter, RotateCcw } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

interface ItemFiltersProps {
  categories?: Category[]
  brands?: Brand[]
  onFilterChange: (filters: ItemFilterValues) => void
}

export interface ItemFilterValues {
  itemType: string | null
  status: string | null
  stockLevel: string | null
  categoryId: string | null
  brandId: string | null
}

const initialFilters: ItemFilterValues = {
  itemType: null,
  status: null,
  stockLevel: null,
  categoryId: null,
  brandId: null,
}

export function ItemFilters({ categories = [], brands = [], onFilterChange }: ItemFiltersProps) {
  const [filters, setFilters] = useState<ItemFilterValues>(initialFilters)
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof ItemFilterValues, value: string | null) => {
    const newFilters = { ...filters, [key]: value === "__all__" ? null : value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    onFilterChange(initialFilters)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Filter Toggle & Active Filter Count */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      {isExpanded && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border">
          {/* Item Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Type</label>
            <Select value={filters.itemType || "__all__"} onValueChange={(v) => updateFilter("itemType", v)}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="fixed_asset">Fixed Asset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Status</label>
            <Select value={filters.status || "__all__"} onValueChange={(v) => updateFilter("status", v)}>
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Level */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Stock Level</label>
            <Select value={filters.stockLevel || "__all__"} onValueChange={(v) => updateFilter("stockLevel", v)}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Levels</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Category</label>
              <Select value={filters.categoryId || "__all__"} onValueChange={(v) => updateFilter("categoryId", v)}>
                <SelectTrigger className="w-[150px] h-8 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Brand */}
          {brands.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Brand</label>
              <Select value={filters.brandId || "__all__"} onValueChange={(v) => updateFilter("brandId", v)}>
                <SelectTrigger className="w-[150px] h-8 text-sm">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2">
          {filters.itemType && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Type: {filters.itemType}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("itemType", null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Status: {filters.status}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("status", null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.stockLevel && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Stock: {filters.stockLevel.replace("_", " ")}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("stockLevel", null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
