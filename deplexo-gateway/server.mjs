import {createGateway} from './gateway.mjs';

const server = createGateway();
server.requestTimeout = 180000;
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => {
 console.log('Krokodil gateway ready');
});
