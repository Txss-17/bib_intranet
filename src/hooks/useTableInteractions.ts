import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc' | null;

interface UseTableInteractionsOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  initialSort?: { column: keyof T; direction: SortDirection };
}

export function useTableInteractions<T extends Record<string, any>>({
  data,
  searchFields = [],
  initialSort,
}: UseTableInteractionsOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(initialSort?.column ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSort?.direction ?? null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const setFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSort = (column: keyof T) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortColumn(null); setSortDirection(null); }
      else setSortDirection('asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery && searchFields.length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => String(item[field]).toLowerCase().includes(q))
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => String(item[key]) === value);
      }
    });

    // Sort
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const aStr = String(aVal);
        const bStr = String(bVal);
        
        // Try numeric comparison
        const aNum = parseFloat(aStr.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bStr.replace(/[^0-9.-]/g, ''));
        
        let comparison: number;
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          comparison = aStr.localeCompare(bStr);
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchQuery, searchFields, filters, sortColumn, sortDirection]);

  return {
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    toggleSort,
    filters,
    setFilter,
    processedData,
  };
}
