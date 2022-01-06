interface PaginationResponse {
    data:any;
    current_page:any;
    per_page:any;
    total_pages:any;
    total_entries:any;
}

interface SimpleResponse {
    data:any;
}

export function buildPaginationResponse(data:any,current_page:any,per_page:any,total_pages:any,total_entries:any):any {
    const response:PaginationResponse = {data,current_page,per_page,total_pages,total_entries};
    return response;
}

export function buildSimpleResponse(data:any):any {
    const response:SimpleResponse = {data};
    return response;
}

