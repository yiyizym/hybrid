import Hybrid from '../src/index';

const hybrid = new Hybrid({});

hybrid.getUserId().then(result => {
    console.log('>>> ', result);
});