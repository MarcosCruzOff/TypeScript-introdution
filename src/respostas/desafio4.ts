var apiKey: string | null;
let requestToken: string;
let username: string;
let password: string;
let sessionId: string | null;
let listId: string | null;
let logged: boolean = false;
var localApiKey: string | any;

let criarListaNome: string;
let criarListaDescricao: string;

let loginButton = document.getElementById('login-button') as HTMLButtonElement;
let searchButton = document.getElementById('search-button') as HTMLButtonElement;
let criarListaButton = document.getElementById('criar-lista-button') as HTMLButtonElement;

let searchContainer = document.getElementById('search-container') as HTMLDivElement;
let loginContainer = document.getElementById('login-container') as HTMLDivElement;
let listCreateContainer = document.getElementById('list-create-container') as HTMLDivElement;
let listContainer = document.getElementById('list-container') as HTMLDivElement;

const INVISIBLE: string = "visually-hidden";

interface movie {
    adult: boolean,
    backdrop_path: string,
    genre_ids: number[],
    id: number,
    original_language: string,
    original_title: string,
    overview: string,
    popularity: number,
    poster_path: string,
    release_date: string,
    title: string,
    video: boolean,
    vote_average: number,
    vote_count: number
}

interface query {
    page: number,
    results: movie[],
    total_pages: number,
    total_results: number
}

interface list {
    created_by: string,
    description: string,
    favorite_count: number,
    id: number,
    items: movie[]
    item_count: number,
    iso_639_1: string,
    name: string,
    poster_path: string
}

interface token {
    success: boolean,
    expires_at: string,
    request_token: string
}

interface httpGet {
    url: string;
    method: string;
    body?: string | object | null
}

class HttpClient {
    static async get({ url, method, body = null }: httpGet): Promise<any> {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open(method, url, true);

            request.onload = () => {
                if (request.status >= 200 && request.status < 300) {
                    resolve(JSON.parse(request.responseText));
                } else {
                    reject({
                        status: request.status,
                        statusText: request.statusText
                    })
                }
            }
            request.onerror = () => {
                reject({
                    status: request.status,
                    statusText: request.statusText
                })
            }

            if (body) {
                request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                body = JSON.stringify(body);
            }
            request.send(body);
        })
    }
}

loginButton.addEventListener('click', async () => {
    await criarRequestToken();
    await logar();
    await criarSessao();
})

searchButton.addEventListener('click', async () => {
    let lista = document.getElementById("lista");
    if (lista) {
        lista.outerHTML = "";
    }
    let query: string = ((<HTMLInputElement>document.getElementById('search')).value);
    let listagemDeFilmes = await procurarFilme(query);
    let ul = document.createElement('ul');
    ul.id = "lista"
    for (const item of listagemDeFilmes.results) {
        let li = document.createElement('li');
        let link = document.createElement('button');
        link.type = "button";
        link.classList.add("btn", "btn-primary", "btn-sm");
        link.addEventListener('click', () => adicionarFilmeNaLista(item.id, parseInt(listId ? listId : '1')))
        link.appendChild(document.createTextNode("+ Lista"));
        li.appendChild(document.createTextNode(item.original_title));
        li.appendChild(document.createTextNode(" - "));
        li.appendChild(link);
        li.classList.add("my-1");
        ul.appendChild(li)
    }
    searchContainer.appendChild(ul);
})

criarListaButton.addEventListener('click', async () => {
    await criarLista(criarListaNome, criarListaDescricao);
})

function preencherSenha(): void {
    password = (<HTMLInputElement>document.getElementById('senha')).value;
    validateLoginButton();
}

function preencherLogin(): void {
    username = (<HTMLInputElement>document.getElementById('login')).value;
    validateLoginButton();
}

function preencherApi(): void {
    globalThis.localApiKey = (<HTMLInputElement>document.getElementById('api-key')).value;
    validateLoginButton();
}

function validateLoginButton(): void {
    if (password && username && localApiKey) {
        loginButton.disabled = false;
    } else {
        loginButton.disabled = true;
    }
}

async function criarRequestToken(): Promise<void> {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/authentication/token/new?api_key=${localApiKey}`,
        method: "GET"
    })
    requestToken = result.request_token;
}

async function logar(): Promise<void> {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${localApiKey}`,
        method: "POST",
        body: {
            username: `${username}`,
            password: `${password}`,
            request_token: `${requestToken}`
        }
    });
    requestToken = result.request_token;
    carregar();
}

async function criarSessao(): Promise<void> {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/authentication/session/new?api_key=${localApiKey}&request_token=${requestToken}`,
        method: "GET"
    })
    sessionId = result.session_id;
    localStorage.setItem("TMDBapiKey", apiKey ? apiKey : "");
    localStorage.setItem("TMDBsessionId", sessionId ? sessionId : "");
    if (sessionId) {
        searchButton.disabled = false;
    }
}

async function procurarFilme(query: string): Promise<query> {
    query = encodeURI(query)
    let result: query = await HttpClient.get({
        url: `https://api.themoviedb.org/3/search/movie?api_key=${localApiKey}&query=${query}`,
        method: "GET"
    })
    return result
}

async function adicionarFilme(filmeId: number): Promise<void> {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${localApiKey}&language=en-US`,
        method: "GET"
    })
    console.log(result);
}

function preencherNomeLista() {
    criarListaNome = (<HTMLInputElement>document.getElementById('criar-lista-nome')).value;
    validateListCreateButton();
}

function preencherDescricaoLista() {
    criarListaDescricao = (<HTMLInputElement>document.getElementById('criar-lista-descricao')).value;
    validateListCreateButton();
}

function validateListCreateButton() {
    if (criarListaNome && criarListaDescricao) {
        criarListaButton.disabled = false;
    } else {
        criarListaButton.disabled = true;
    }
}

async function criarLista(nomeDaLista: string, descricao: string): Promise<void> {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/list?api_key=${localApiKey}&session_id=${sessionId}`,
        method: "POST",
        body: {
            name: nomeDaLista,
            description: descricao,
            language: "pt-br"
        }
    })
    listId = result.list_id;
    localStorage.setItem("TMDBlistId", listId ? listId : "");
    carregar();
}

async function adicionarFilmeNaLista(filmeId: number, listaId: number): Promise<void | any> {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${localApiKey}&session_id=${sessionId}`,
        method: "POST",
        body: {
            media_id: filmeId
        }
    })
    carregar();
}

async function pegarLista(): Promise<list> {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/list/${listId}?api_key=${localApiKey}`,
        method: "GET"
    })
    return result
}

async function montarLista(): Promise<void> {
    let listBody = document.getElementById('list-body') as HTMLDivElement;
    if (listBody) {
        listBody.innerHTML = "";
    }
    let listaDeFilmes = await pegarLista();
    let title = document.createElement('div');
    title.id = "lista-filmes-title";
    let nomeLista = document.createElement('h5');
    nomeLista.appendChild(document.createTextNode(listaDeFilmes.name));
    title.appendChild(nomeLista);
    let descricaoLista = document.createElement('h6');
    descricaoLista.appendChild(document.createTextNode(listaDeFilmes.description));
    title.appendChild(descricaoLista);
    listBody.appendChild(title);
    let ul = document.createElement('ul');
    ul.id = "lista-filmes";
    for (const filme of listaDeFilmes.items) {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode(filme.original_title));
        ul.appendChild(li);
    }
    listBody.appendChild(ul);
}

function carregar(): void {
    sessionId = localStorage.getItem("TMDBsessionId");
    apiKey = apiKey;
    if (sessionId && apiKey) {
        loginContainer.classList.add(INVISIBLE);
    } else {
        loginContainer.classList.remove(INVISIBLE);
    }

    listId = localStorage.getItem("TMDBlistId");
    if (listId) {
        montarLista();
        listCreateContainer.classList.add(INVISIBLE);
        searchContainer.classList.remove(INVISIBLE);
        listContainer.classList.remove(INVISIBLE);
    } else {
        listCreateContainer.classList.remove(INVISIBLE);
        searchContainer.classList.add(INVISIBLE);
        listContainer.classList.add(INVISIBLE);
    }
}