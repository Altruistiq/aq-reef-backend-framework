import {initializeServer} from "./index";

initializeServer(true).then((app) => console.log('server started', app))
