// Processamento de capas, independente da interface e da persistência.
const BibliotecaCovers = (() => {
    function load(src) {
        return new Promise((resolve, reject) => {
            const img = new Image(); img.referrerPolicy = 'no-referrer';
            const timer = setTimeout(() => { img.src = ''; reject(new Error('Tempo de carregamento excedido.')); }, 15000);
            img.onload = () => { clearTimeout(timer); resolve(img); };
            img.onerror = () => { clearTimeout(timer); reject(new Error('Não foi possível abrir a imagem.')); };
            img.src = src;
        });
    }
    async function fromFile(file) {
        if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Use JPEG, PNG, WebP ou GIF.');
        if (file.size > 20 * 1024 * 1024) throw new Error('Imagem maior que 20 MiB.');
        const url = URL.createObjectURL(file);
        try {
            const img = await load(url);
            const scale = Math.min(1, 600/img.naturalWidth, 800/img.naturalHeight);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.naturalWidth*scale));
            canvas.height = Math.max(1, Math.round(img.naturalHeight*scale));
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(img,0,0,canvas.width,canvas.height);
            const blob = await new Promise((resolve,reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Falha na conversão.')), 'image/jpeg', .72));
            const chosen = blob.size < file.size || file.type === 'image/gif' ? blob : file;
            const src = await new Promise((resolve,reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error('Falha na leitura.')); r.readAsDataURL(chosen); });
            const resized = chosen === blob;
            return {src, message: `${resized ? canvas.width : img.naturalWidth} × ${resized ? canvas.height : img.naturalHeight} px · ${(file.size/1024).toFixed(1)} → ${(chosen.size/1024).toFixed(1)} KiB · ${resized ? 'JPEG' : file.type} (antes de Base64)`};
        } finally { URL.revokeObjectURL(url); }
    }
    async function fromUrl(value) {
        let url; try { url = new URL(value.trim()); } catch { throw new Error('URL inválida.'); }
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use uma URL HTTPS sem credenciais.');
        const img = await load(url.href);
        return {src: url.href, message: `${img.naturalWidth} × ${img.naturalHeight} px · URL externa (tamanho do arquivo não medido).`};
    }
    return Object.freeze({fromFile, fromUrl});
})();
