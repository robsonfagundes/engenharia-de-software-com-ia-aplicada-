import { UserController } from './controller/UserController.js';
import { ProductController } from './controller/ProductController.js';
import { ModelController } from './controller/ModelTrainingController.js';
import { TFVisorController } from './controller/TFVisorController.js';
import { TFVisorView } from './view/TFVisorView.js';
import { UserService } from './service/UserService.js';
import { ProductService } from './service/ProductService.js';
import { UserView } from './view/UserView.js';
import { ProductView } from './view/ProductView.js';
import { ModelView } from './view/ModelTrainingView.js';
import Events from './events/events.js';
import { WorkerController } from './controller/WorkerController.js';

// Ponto de composição da aplicação: cria uma única instância de cada serviço,
// view e controller e conecta todos por meio do barramento de eventos.

// Serviços compartilhados fazem a comunicação com a API Node.js.
const userService = new UserService();
const productService = new ProductService();

// Views conhecem somente o DOM; regras de negócio ficam nos controllers.
const userView = new UserView();
const productView = new ProductView();
const modelView = new ModelView();
const tfVisorView = new TFVisorView();
const mlWorker = new Worker('/src/workers/modelTrainingWorker.js', { type: 'module' });

// O treinamento ocorre em outra thread para não travar a interface do navegador.
const w = WorkerController.init({
    worker: mlWorker,
    events: Events
});

// Treina uma primeira versão automaticamente com os clientes persistidos.
const users = await userService.getDefaultUsers();
w.triggerTrain(users);


// Controllers coordenam serviços, views, eventos e o Web Worker.
ModelController.init({
    modelView,
    userService,
    events: Events,
});

TFVisorController.init({
    tfVisorView,
    events: Events,
});

ProductController.init({
    productView,
    userService,
    productService,
    events: Events,
});


const userController = UserController.init({
    userView,
    userService,
    productService,
    events: Events,
});


// Cliente acadêmico sem histórico, útil para demonstrar o cold start.
userController.renderUsers({
    "id": 99,
    "name": "Josézin da Silva",
    "age": 30,
    "purchases": []
});
