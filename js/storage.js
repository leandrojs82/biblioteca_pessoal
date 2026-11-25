// Camada de persistência; independente da interface do catálogo.
const BibliotecaStorage = (() => {
    const chave = 'biblioteca-pessoal-v2';
    function validar(livros) {
        if (!Array.isArray(livros) || !livros.every(b => b &&
            ['id', 'title', 'author', 'cat'].every(k => typeof b[k] === 'string' && b[k].trim()) &&
            (b.cover == null || typeof b.cover === 'string')) ||
            new Set(livros.map(b => b.id)).size !== livros.length) {
            throw new Error('Lista de livros inválida ou IDs duplicados.');
        }
        return livros;
    }
    async function carregarCatalogoInicial() {
        const resposta = await fetch('./data/livros.json');
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        return validar(await resposta.json());
    }
    function carregarLivros() {
        const dados = localStorage.getItem(chave);
        return dados === null ? null : validar(JSON.parse(dados));
    }
    function salvarLivros(livros) {
        localStorage.setItem(chave, JSON.stringify(validar(livros)));
    }
    function exportarBackup(livros) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(validar(livros), null, 2)], {type: 'application/json'}));
        const a = document.createElement('a');
        a.href = url; a.download = 'backup-biblioteca.json'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    async function importarBackup(arquivo) {
        return validar(JSON.parse(await arquivo.text()));
    }
    function calcularUsoArmazenamento() {
        return 2 * (chave.length + (localStorage.getItem(chave) ?? '').length);
    }
    return Object.freeze({carregarCatalogoInicial, carregarLivros, salvarLivros, exportarBackup, importarBackup, calcularUsoArmazenamento});
})();
