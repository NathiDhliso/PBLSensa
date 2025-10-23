import React, { useState } from 'react';
import { Filter, SortAsc, SortDesc, Search } from 'lucide-react';
import { AnalogyNode } from './AnalogyNode';
import { Button } from '../ui/Button';

interface Analogy {
  id: string;
  concept_id: string;
  user_experience_text: string;
  connection_explanation?: string;
  strength: number;
  tags: string[];
  type: string;
  reusable: boolean;
  created_at: string;
}

interface AnalogyListProps {
  analogies: Analogy[];
  onEdit?: (analogy: Analogy) => void;
  onDelete?: (analogyId: string) => void;
  onStrengthen?: (analogyId: string, newStrength: number) => void;
  loading?: boolean;
}

type SortField = 'created_at' | 'strength' | 'tags';
type SortOrder = 'asc' | 'desc';

export const AnalogyList: React.FC<AnalogyListProps> = ({
  analogies,
  onEdit,
  onDelete,
  onStrengthen,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReusable, setFilterReusable] = useState<boolean | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Get all unique tags
  const allTags = Array.from(
    new Set(analogies.flatMap(a => a.tags))
  ).sort();

  // Filter analogies
  const filteredAnalogies = analogies.filter(analogy => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        analogy.user_experience_text.toLowerCase().includes(query) ||
        analogy.tags.some(tag => tag.toLowerCase().includes(query)) ||
        analogy.connection_explanation?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Reusable filter
    if (filterReusable !== null && analogy.reusable !== filterReusable) {
      return false;
    }

    // Tag filter
    if (filterTag && !analogy.tags.includes(filterTag)) {
      return false;
    }

    return true;
  });

  // Sort analogies
  const sortedAnalogies = [...filteredAnalogies].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'strength':
        comparison = a.strength - b.strength;
        break;
      case 'tags':
        comparison = (a.tags[0] || '').localeCompare(b.tags[0] || '');
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search analogies..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filters:
          </span>
          
          {/* Reusable filter */}
          <div className="flex items-center gap-1">
            <Button
              variant={filterReusable === null ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterReusable(null)}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={filterReusable === true ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterReusable(true)}
              className="text-xs"
            >
              Reusable
            </Button>
            <Button
              variant={filterReusable === false ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterReusable(false)}
              className="text-xs"
            >
              Non-reusable
            </Button>
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <>
              <span className="text-xs text-gray-400">|</span>
              <select
                value={filterTag || ''}
                onChange={(e) => setFilterTag(e.target.value || null)}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">All tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Sort by:
          </span>
          <Button
            variant={sortField === 'created_at' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => toggleSort('created_at')}
            className="text-xs"
          >
            Date {sortField === 'created_at' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
          </Button>
          <Button
            variant={sortField === 'strength' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => toggleSort('strength')}
            className="text-xs"
          >
            Strength {sortField === 'strength' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
          </Button>
          <Button
            variant={sortField === 'tags' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => toggleSort('tags')}
            className="text-xs"
          >
            Tag {sortField === 'tags' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {sortedAnalogies.length} of {analogies.length} analogies
      </div>

      {/* Analogy list */}
      {sortedAnalogies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || filterReusable !== null || filterTag
              ? 'No analogies match your filters'
              : 'No analogies yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAnalogies.map(analogy => (
            <AnalogyNode
              key={analogy.id}
              analogy={analogy}
              onEdit={onEdit ? () => onEdit(analogy) : undefined}
              onDelete={onDelete ? () => onDelete(analogy.id) : undefined}
              onStrengthen={onStrengthen ? (strength) => onStrengthen(analogy.id, strength) : undefined}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
};
