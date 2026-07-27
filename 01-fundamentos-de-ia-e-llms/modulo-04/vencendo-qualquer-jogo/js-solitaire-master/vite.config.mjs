import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    server: {
        host: 'localhost',
        port: 3000
    },
    build: {
        outDir: '../build',
        emptyOutDir: true
    }
});
