import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Building2, 
  FileCheck, 
  Users, 
  Plus, 
  UserPlus, 
  Calendar,
  FileText,
  CreditCard
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'pratiche' | 'contatti' | 'azioni';
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Mock data for search results
  const allItems: CommandItem[] = [
    // Pratiche
    {
      id: 'pratica-1',
      label: 'Pratica #1234 — Mario Rossi',
      icon: Building2,
      category: 'pratiche',
      action: () => { navigate('/comune-catasto'); onClose(); }
    },
    {
      id: 'pratica-2',
      label: 'Pratica #1235 — Luigi Bianchi',
      icon: Building2,
      category: 'pratiche',
      action: () => { navigate('/comune-catasto'); onClose(); }
    },
    {
      id: 'ape-1',
      label: 'APE #89 — Via Roma 15',
      icon: FileCheck,
      category: 'pratiche',
      action: () => { navigate('/ape'); onClose(); }
    },
    // Contatti
    {
      id: 'contatto-1',
      label: 'Mario Rossi — Geometra',
      icon: Users,
      category: 'contatti',
      action: () => { navigate('/rubrica'); onClose(); }
    },
    {
      id: 'contatto-2',
      label: 'Luigi Bianchi — Architetto',
      icon: Users,
      category: 'contatti',
      action: () => { navigate('/rubrica'); onClose(); }
    },
    // Azioni rapide
    {
      id: 'action-new-pratica',
      label: 'Nuova pratica',
      icon: Plus,
      category: 'azioni',
      action: () => { navigate('/comune-catasto'); onClose(); },
      shortcut: '⌘N'
    },
    {
      id: 'action-new-contatto',
      label: 'Nuovo contatto',
      icon: UserPlus,
      category: 'azioni',
      action: () => { navigate('/rubrica'); onClose(); },
      shortcut: '⌘⇧N'
    },
    {
      id: 'action-planner',
      label: 'Apri Planner',
      icon: Calendar,
      category: 'azioni',
      action: () => { navigate('/planner'); onClose(); }
    },
    {
      id: 'action-fattura',
      label: 'Nuova fattura',
      icon: FileText,
      category: 'azioni',
      action: () => { navigate('/contabilita'); onClose(); }
    },
    {
      id: 'action-spese',
      label: 'Registra spesa',
      icon: CreditCard,
      category: 'azioni',
      action: () => { navigate('/spese'); onClose(); }
    }
  ];

  // Filter items based on query
  const filteredItems = query.length > 0
    ? allItems.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  // Group items by category
  const groupedItems = {
    pratiche: filteredItems.filter(item => item.category === 'pratiche'),
    contatti: filteredItems.filter(item => item.category === 'contatti'),
    azioni: filteredItems.filter(item => item.category === 'azioni')
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredItems, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      const selectedElement = list.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let itemIndex = 0;

  return (
    <div className="command-palette" onClick={onClose}>
      <div 
        className="command-palette-content"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cerca pratiche, contatti, azioni..."
            className="command-palette-input pl-12 pr-4"
          />
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-ink-500">
              Nessun risultato trovato
            </div>
          ) : (
            <>
              {/* Pratiche */}
              {groupedItems.pratiche.length > 0 && (
                <div className="command-palette-group">
                  <div className="command-palette-label">Pratiche</div>
                  {groupedItems.pratiche.map(item => {
                    const currentIndex = itemIndex++;
                    return (
                      <div
                        key={item.id}
                        data-index={currentIndex}
                        className={`command-palette-item ${
                          currentIndex === selectedIndex ? 'command-palette-item-selected' : ''
                        }`}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <item.icon className="w-4 h-4 text-ink-400" />
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="text-xs font-mono text-ink-400 bg-ink-100 px-1.5 py-0.5 rounded">
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Contatti */}
              {groupedItems.contatti.length > 0 && (
                <div className="command-palette-group">
                  <div className="command-palette-label">Contatti</div>
                  {groupedItems.contatti.map(item => {
                    const currentIndex = itemIndex++;
                    return (
                      <div
                        key={item.id}
                        data-index={currentIndex}
                        className={`command-palette-item ${
                          currentIndex === selectedIndex ? 'command-palette-item-selected' : ''
                        }`}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <item.icon className="w-4 h-4 text-ink-400" />
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="text-xs font-mono text-ink-400 bg-ink-100 px-1.5 py-0.5 rounded">
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Azioni */}
              {groupedItems.azioni.length > 0 && (
                <div className="command-palette-group">
                  <div className="command-palette-label">Azioni</div>
                  {groupedItems.azioni.map(item => {
                    const currentIndex = itemIndex++;
                    return (
                      <div
                        key={item.id}
                        data-index={currentIndex}
                        className={`command-palette-item ${
                          currentIndex === selectedIndex ? 'command-palette-item-selected' : ''
                        }`}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <item.icon className="w-4 h-4 text-signal-500" />
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="text-xs font-mono text-ink-400 bg-ink-100 px-1.5 py-0.5 rounded">
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-ink-50 border-t border-ink-200 flex items-center gap-4 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white border border-ink-200 px-1 rounded">↑↓</kbd>
            naviga
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white border border-ink-200 px-1 rounded">↵</kbd>
            seleziona
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white border border-ink-200 px-1 rounded">esc</kbd>
            chiudi
          </span>
        </div>
      </div>
    </div>
  );
};
