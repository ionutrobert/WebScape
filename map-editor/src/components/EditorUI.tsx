'use client';

import { useState } from 'react';
import { useEditorStore, EditorTool } from '@/stores/editorStore';
import { saveWorldToDb, resizeWorld, loadWorldFromDb } from '@/lib/editorDb';
import { TileType, TILE_COLORS } from '@/types/editor';
import { OBJECTS } from '@/types/objects';
import { 
  MousePointer2, 
  Paintbrush, 
  Box, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Magnet, 
  Minus, 
  Dice5,
  Save, 
  FolderOpen,
  Undo2,
  Redo2,
  Grid3X3,
  Settings
} from 'lucide-react';

const TILE_TYPES: TileType[] = ['grass', 'dirt', 'water', 'sand', 'stone', 'snow', 'cave', 'dungeon'];

const TOOLS: { id: EditorTool; name: string; icon: React.ReactNode; description: string }[] = [
  { id: 'select', name: 'Select', icon: <MousePointer2 size={18} />, description: 'Click to view tile info' },
  { id: 'paint', name: 'Paint', icon: <Paintbrush size={18} />, description: 'Paint ground type' },
  { id: 'place', name: 'Place', icon: <Box size={18} />, description: 'Place objects' },
  { id: 'delete', name: 'Delete', icon: <Trash2 size={18} />, description: 'Remove objects' },
  { id: 'raise', name: 'Raise', icon: <ArrowUp size={18} />, description: 'Raise terrain' },
  { id: 'lower', name: 'Lower', icon: <ArrowDown size={18} />, description: 'Lower terrain' },
  { id: 'smooth', name: 'Smooth', icon: <Magnet size={18} />, description: 'Smooth terrain' },
  { id: 'flatten', name: 'Flatten', icon: <Minus size={18} />, description: 'Flatten to height' },
  { id: 'noise', name: 'Noise', icon: <Dice5 size={18} />, description: 'Randomize terrain' },
];

export function EditorUI() {
  const {
    tool,
    setTool,
    selectedTileType,
    setSelectedTileType,
    selectedObjectId,
    setSelectedObjectId,
    brushSize,
    setBrushSize,
    brushStrength,
    setBrushStrength,
    flattenHeight,
    setFlattenHeight,
    noiseRange,
    setNoiseRange,
    cursorTile,
    showGrid,
    toggleGrid,
    tiles,
    objects,
    worldWidth,
    worldHeight,
    setWorldSize,
    setTiles,
    setObjects,
    undo,
    redo,
    history,
    historyIndex
  } = useEditorStore();
  
  const [saving, setSaving] = useState(false);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [newWidth, setNewWidth] = useState(worldWidth);
  const [newHeight, setNewHeight] = useState(worldHeight);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWorldToDb(tiles, objects, worldWidth, worldHeight);
      alert('World saved!');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save world');
    }
    setSaving(false);
  };
  
  const handleLoad = async () => {
    const data = await loadWorldFromDb();
    if (data) {
      const tileMap = new Map<string, any>();
      data.tiles.forEach(t => tileMap.set(`${t.x},${t.y}`, t));
      setTiles(tileMap);
      setObjects(data.objects);
      setWorldSize(data.width, data.height);
      alert('World loaded!');
    }
  };
  
  const handleResize = async () => {
    await resizeWorld(newWidth, newHeight);
    setWorldSize(newWidth, newHeight);
    setShowResizeModal(false);
    window.location.reload();
  };
  
  const tileColors: Record<TileType, string> = {
    grass: '#4a7c23',
    dirt: '#8b6914',
    water: '#2d5aa0',
    sand: '#d4b896',
    stone: '#6b6b6b',
    snow: '#e8e8e8',
    cave: '#3d2817',
    dungeon: '#2a2a2a',
  };
  
  const objectList = Object.values(OBJECTS);
  
  return (
    <div style={{
      width: '280px',
      background: '#1e1e2e',
      borderLeft: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #333',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 12px',
            background: '#4a9eff',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save'}
        </button>
        
        <button
          onClick={handleLoad}
          style={{
            padding: '8px 12px',
            background: '#444',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FolderOpen size={14} />
          Load
        </button>
        
        <button
          onClick={() => setShowResizeModal(true)}
          style={{
            padding: '8px 12px',
            background: '#444',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Settings size={14} />
          Resize
        </button>
        
        <button
          onClick={toggleGrid}
          style={{
            padding: '8px 12px',
            background: showGrid ? '#4a9eff' : '#444',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Grid3X3 size={14} />
        </button>
        
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          style={{
            padding: '8px 12px',
            background: historyIndex > 0 ? '#444' : '#333',
            color: historyIndex > 0 ? 'white' : '#666',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Undo2 size={14} />
        </button>
        
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          style={{
            padding: '8px 12px',
            background: historyIndex < history.length - 1 ? '#444' : '#333',
            color: historyIndex < history.length - 1 ? 'white' : '#666',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Redo2 size={14} />
        </button>
      </div>
      
      {/* Tools */}
      <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
          Tools
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.description}
              style={{
                padding: '10px 8px',
                background: tool === t.id ? '#4a9eff' : '#2a2a3a',
                color: 'white',
                borderRadius: '6px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'background 0.2s'
              }}
            >
              {t.icon}
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Brush Settings */}
      {(tool === 'paint' || tool === 'raise' || tool === 'lower' || tool === 'smooth' || tool === 'flatten' || tool === 'noise') && (
        <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
            Brush Settings
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>
              Size: {brushSize}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>
              Strength: {brushStrength.toFixed(2)}
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={brushStrength}
              onChange={e => setBrushStrength(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          {tool === 'flatten' && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>
                Target Height: {flattenHeight}
              </div>
              <input
                type="range"
                min="-10"
                max="20"
                step="0.5"
                value={flattenHeight}
                onChange={e => setFlattenHeight(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          )}
          
          {tool === 'noise' && (
            <div>
              <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>
                Noise Range: {noiseRange}
              </div>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={noiseRange}
                onChange={e => setNoiseRange(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Tile Palette */}
      {tool === 'paint' && (
        <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
            Ground Tiles
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {TILE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedTileType(type)}
                title={type}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: tileColors[type],
                  border: selectedTileType === type ? '3px solid #fff' : '2px solid #444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '9px',
                  color: type === 'water' || type === 'snow' ? '#333' : '#fff',
                  textTransform: 'capitalize',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '4px'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Object Palette */}
      {tool === 'place' && (
        <div style={{ padding: '12px', borderBottom: '1px solid #333', flex: 1, overflow: 'auto' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
            Objects
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {objectList.map(obj => (
              <button
                key={obj.id}
                onClick={() => setSelectedObjectId(obj.id)}
                style={{
                  padding: '8px 12px',
                  background: selectedObjectId === obj.id ? '#4a9eff' : '#2a2a3a',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                {obj.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Status Bar */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid #333',
        background: '#151520',
        fontSize: '12px',
        color: '#888'
      }}>
        {cursorTile ? (
          <span>
            Cursor: ({cursorTile.x}, {cursorTile.y}) | 
            Tool: <span style={{ color: '#4a9eff' }}>{tool}</span>
          </span>
        ) : (
          <span>Move mouse over map to edit</span>
        )}
      </div>
      
      {/* Resize Modal */}
      {showResizeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e1e2e',
            padding: '24px',
            borderRadius: '12px',
            width: '300px'
          }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>Resize World</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Width
              </label>
              <input
                type="number"
                value={newWidth}
                onChange={e => setNewWidth(Number(e.target.value))}
                min={10}
                max={200}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: 'white'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Height
              </label>
              <input
                type="number"
                value={newHeight}
                onChange={e => setNewHeight(Number(e.target.value))}
                min={10}
                max={200}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: 'white'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowResizeModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#444',
                  color: 'white',
                  borderRadius: '6px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResize}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#4a9eff',
                  color: 'white',
                  borderRadius: '6px'
                }}
              >
                Resize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
