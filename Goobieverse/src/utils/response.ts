export const Response = {
    success : (data: any) => {
        return {status: 'success',...data};
    },
    error:(message: string,additionalFields?:any) => {
        return { status: 'failure', message: message,...additionalFields};
    }
};

export enum HTTPStatusCode {
  OK = 200,
  Found = 302,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
}
