document.getElementById('cadastroLojaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Pega os valores de categoria do select e do campo de texto
    const categoriaSelect = form.querySelector('select[name="categoria"]').value;
    const categoriaTexto = form.querySelector('input[name="categoriaTexto"]').value.trim();

    // Se o usuário escreveu algo no campo de texto, use isso
    if (categoriaTexto) {
        formData.set('categoria', categoriaTexto);
    } else {
        formData.set('categoria', categoriaSelect);
    }

    try {
        const res = await fetch('http://localhost:3000/api/lojas', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            alert('Loja cadastrada com sucesso!');
            form.reset();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao cadastrar loja.');
    }
});
