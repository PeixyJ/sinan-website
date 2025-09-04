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

export interface CollectionUserInfoResp {
    userId: string
    avatar: string
    name: string
    collectedAt: string
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

export interface UserLoginResp {
    userInfo: UserInfo
    tokenInfo: SaTokenInfo
}

export interface UserRegister {
    username: string,
    email: string
    password: string
}

export interface UserLoginReq {
    credential: string
    password: string
}

// 书签相关类型
export interface BookmarkResp {
    id: string
    spaceId: string
    name: string
    description: string
    url: string
    icon: number | string
    num: number
    star: boolean
    tags?: TagResp[]
}

export interface SnBookmark {
    id: string
    userId: string
    namespaceId: string
    name: string
    description: string
    url: string
    icon: number | string
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
    icon?:string
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
    shared: boolean
    key: string
    description: string
    createTime: string
    updateTime: string
}


export interface SpaceRespSimple {
    id: string
    name: string
    icon: string
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
    sort: number
    description: string
    createTime: string
    updateTime: string
}

export interface AddTagReq {
    name: string
    color: string
    description?: string
}

export interface EditTagReq {
    id: string
    name?: string
    color: string
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
    icon: number | string
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
    icon?: number | string
    tag?: string
}

export interface EditReceivedBookmarkReq {
    id: string
    name?: string
    url?: string
    description?: string
    namespaceId?: string
    group?: string
    icon?: number | string
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

export interface SpaceDragSortParams {
    draggedSpaceId?: string,
    targetIndex?: string,
    sortedSpaceIds?: string[],
}

export interface TagQueryParams {
    page?: number
    size?: number
    search?: string
}

export interface TagDragSortParams {
    sortedTagIds?: string[],
    draggedTagId?: string,
    targetIndex?: string,
}

export interface ReceivedBookmarkQueryParams {
    search?: string
    state?: number
    page?: number
    size?: number
}

export interface ImportBookmarkResp {
    successCount: number
    failCount: number
    totalCount: number
    message: string
}

// 用户Key相关类型
export interface UserKeyResp {
    id: string
    userId: string
    accessKey: string
    keyName?: string
    description?: string
    createTime: string
    updateTime: string
}

export interface CreateUserKeyReq {
    keyName?: string
    description?: string
}

export interface ChangePasswordReq {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export interface UpdateShareBookmarkReq {
    spaceId: string
    enable: boolean
    key?: string
}

export interface SearchCollectionUserReq {
    page?: number
    size?: number
    spaceId?: string
}

export interface RemoveShareBookmarkReq {
    spaceId: string
    userId: string
}

export interface CollectionSpaceReq {
    spaceId: string
    password: string
}

export interface GetShareUrl {
    spaceId: string
}

export interface PasskeyRegistrationReq {
    credential: string
    describe: string
}

export interface PasskeyResp {
    id: string
    describe?: string
    createTime: string
    lastUsed: string
}

export interface ChangePasskeyReq{
    id: string
    describe: string
}

export interface PasskeyRegistrationReq {
    credential: string
    describe: string
}

export interface Credential {
  id: string;
  [key: string]: any;
}