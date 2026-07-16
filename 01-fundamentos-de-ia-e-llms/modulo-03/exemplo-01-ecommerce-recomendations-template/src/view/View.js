/** Oferece operações de template compartilhadas pelas views da aplicação. */
export class View {
    /** Preserva o contexto de loadTemplate quando o método é usado como callback. */
    constructor() {
        this.loadTemplate = this.loadTemplate.bind(this);
    }

    /** Baixa um fragmento HTML reutilizável. */
    async loadTemplate(templatePath) {
        const response = await fetch(templatePath);
        return await response.text();
    }

    /** Substitui todos os marcadores {{chave}} pelos valores fornecidos. */
    replaceTemplate(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return result;
    }
}
