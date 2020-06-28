import { IncomingMessage } from "http";

enum LocalIpAddress {
  localhostV4 = '::ffff:127.0.0.1',
  localhostV6 = '::1',
  localhost = '127.0.0.1',
};

function getRemoteIpAddress(request: IncomingMessage): string {
  const { headers } = request;

  if (headers['x-forwarded-for']) {
    const ipArr = headers['x-forwarded-for'] as string;

    return ipArr.split(',').map((ip) => ip.trim())[0];
  }

  const { remoteAddress } = request.connection;

  if (remoteAddress === LocalIpAddress.localhostV4
    || remoteAddress === LocalIpAddress.localhostV6) {
    return LocalIpAddress.localhost;
  }

  return request.connection.remoteAddress as string;
}

export {
  getRemoteIpAddress,
  LocalIpAddress,
};
