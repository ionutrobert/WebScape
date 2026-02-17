'use client';

import { useEffect } from 'react';
import { EditorScene } from '@/components/EditorScene';
import { EditorUI } from '@/components/EditorUI';
import { useEditorStore } from '@/stores/editorStore';
import { loadWorldFromDb, initializeWorld } from '@/lib/editorDb';

export default function EditorPage() {
  const { isLoading, setLoading, setWorldSize } = useEditorStore();

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const data = await loadWorldFromDb();
        if (data) {
          setWorldSize(data.width, data.height);
        } else {
          await initializeWorld(32, 32);
          setWorldSize(32, 32);
        }
      } catch (err) {
        console.error('Failed to load world:', err);
        await initializeWorld(32, 32);
        setWorldSize(32, 32);
      }
      setLoading(false);
    }
    init();
  }, [setLoading, setWorldSize]);

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        Loading world...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <EditorScene />
      </div>
      <EditorUI />
    </div>
  );
}
