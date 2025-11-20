const LAYOUT_STORAGE_KEY = 'terminal-layout-config';
const LAYOUTS_LIST_KEY = 'terminal-saved-layouts';

export const LayoutManager = {
  // Save current layout
  saveLayout(name, blocks) {
    const layouts = this.getAllLayouts();
    const layout = {
      name,
      blocks: blocks.map(b => ({
        id: b.id,
        type: b.type,
        terminalId: b.terminalId,
        shellType: b.shellType
      })),
      timestamp: Date.now()
    };
    
    layouts[name] = layout;
    localStorage.setItem(LAYOUTS_LIST_KEY, JSON.stringify(layouts));
    return layout;
  },

  // Load layout by name
  loadLayout(name) {
    const layouts = this.getAllLayouts();
    return layouts[name] || null;
  },

  // Get all saved layouts
  getAllLayouts() {
    const data = localStorage.getItem(LAYOUTS_LIST_KEY);
    return data ? JSON.parse(data) : {};
  },

  // Delete a layout
  deleteLayout(name) {
    const layouts = this.getAllLayouts();
    delete layouts[name];
    localStorage.setItem(LAYOUTS_LIST_KEY, JSON.stringify(layouts));
  },

  // Save current as default
  saveAsDefault(blocks) {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(blocks));
  },

  // Load default layout
  loadDefault() {
    const data = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Export layout to JSON file
  exportLayout(name, blocks) {
    const layout = {
      name,
      blocks,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    
    const json = JSON.stringify(layout, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-layout-${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import layout from JSON
  async importLayout(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const layout = JSON.parse(e.target.result);
          if (layout.blocks && Array.isArray(layout.blocks)) {
            resolve(layout);
          } else {
            reject(new Error('Invalid layout format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
};
