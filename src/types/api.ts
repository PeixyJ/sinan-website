// 通用响应结构
export interface ApiResponse<T = any> {
    code: number
    message: string
    description: string
    data: T
    date: number
    flag: boolean
    messageId: string
}

export interface Page<T = any> {
    records: T[],
    total: number
    size: number,
    current: number,
    pages: number,
}

// SaToken信息
export interface SaTokenInfo {
    tokenName: string
    tokenValue: string
    isLogin: boolean
    loginId: any
    loginType: string
    tokenTimeout: number
    sessionTimeout: number
    tokenSessionTimeout: number
    tokenActiveTimeout: number
    loginDeviceType: string
    tag: string
}

export interface UserInfo {
    name: string,
    email: string,
    avatar: string
}

// 书签相关类型
export interface BookmarkResp {
    id: string
    namespaceId: string
    name: string
    description: string
    url: string
    icon: number
    num: number
    tags?: TagResp[]
}

export interface SnBookmark {
    id: string
    userId: string
    namespaceId: string
    name: string
    description: string
    url: string
    icon: number
    num: number
    star: boolean
    createTime: string
    updateTime: string
    deleted: number
}

export interface AddBookmarkReq {
    name: string
    url: string
    description?: string
    namespaceId?: string
    tagsIds?: string[]
}

export interface EditBookmarkReq {
    id: string
    name?: string
    url?: string
    description?: string
    namespaceId?: string
    tags?: string[]
}

// 空间相关类型
export interface SpaceResp {
    id: string
    name: string
    icon: string
    sort: number
    description: string
    createTime: string
    updateTime: string
}

export interface AddSpaceReq {
    name: string
    icon?: string
    sort?: number
    description?: string
}

export interface EditSpaceReq {
    id: string
    name?: string
    icon?: string
    sort?: number
    description?: string
}

export interface SortUpdateReq {
    id: string
    sort: number
}

export interface SpaceBookmarkStatsResp {
    spaceId: string
    totalCount: number
}

// 标签相关类型
export interface TagResp {
    id: string
    name: string
    color: string
    description: string
    createTime: string
    updateTime: string
}

export interface AddTagReq {
    name: string
    color?: string
    description?: string
}

export interface EditTagReq {
    id: string
    name?: string
    color?: string
    description?: string
}

export interface TagStatsResp {
    totalCount: number
}

export interface TagBookmarkStatsResp {
    tagId: string
    totalCount: number
}

// 接收书签相关类型
export interface ReceivedBookmarkResp {
    id: string
    namespaceId: string
    group: string
    name: string
    description: string
    url: string
    icon: number
    tag: string
    state: number // 1=待确认，2=已确认，3=已删除
    createTime: string
    updateTime: string
}

export interface AddReceivedBookmarkReq {
    name: string
    url: string
    description?: string
    namespaceId?: string
    group?: string
    icon?: number
    tag?: string
}

export interface EditReceivedBookmarkReq {
    id: string
    name?: string
    url?: string
    description?: string
    namespaceId?: string
    group?: string
    icon?: number
    tag?: string
}

export interface ReceivedBookmarkStatsResp {
    pendingCount: number
    confirmedCount: number
    deletedCount: number
    totalCount: number
}

// 查询参数类型
export interface BookmarkQueryParams {
    limit?: number
    search?: string
}

export interface SpaceQueryParams {
    page?: number
    size?: number
    search?: string
}

export interface TagQueryParams {
    page?: number
    size?: number
    search?: string
}

export interface ReceivedBookmarkQueryParams {
    search?: string
    state?: number
}