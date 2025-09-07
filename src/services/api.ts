import {http} from '@/lib/http'
import type {
    BookmarkResp,
    SnBookmark,
    AddBookmarkReq,
    EditBookmarkReq,
    BookmarkQueryParams,
    SpaceResp,
    AddSpaceReq,
    EditSpaceReq,
    SortUpdateReq,
    SpaceBookmarkStatsResp,
    SpaceQueryParams,
    TagResp,
    AddTagReq,
    EditTagReq,
    TagStatsResp,
    TagBookmarkStatsResp,
    TagQueryParams,
    ReceivedBookmarkResp,
    AddReceivedBookmarkReq,
    EditReceivedBookmarkReq,
    ReceivedBookmarkStatsResp,
    ReceivedBookmarkQueryParams, UserInfo, Page, ImportBookmarkResp, SpaceRespSimple, SpaceDragSortParams,
    TagDragSortParams, UserRegister, UserLoginResp, UserLoginReq, UserKeyResp, CreateUserKeyReq, ChangePasswordReq,
    UpdateShareBookmarkReq, RemoveShareBookmarkReq, SearchCollectionUserReq, GetShareUrl, CollectionUserInfoResp,
    CollectionSpaceReq,PasskeyRegistrationReq,ChangePasskeyReq,PasskeyResp
} from '@/types/api'

export class GithubAPI {
    static getRedirect() {
        return http.get<String>('/user/github/oauth2/redirect')
    }

    static doLogin(code: string) {
        return http.get<UserLoginResp>('/user/github/oauth2/login', {params: {code}})
    }
}

export class PasskeyAPI{
    static getRegistrationOptions() {
        return http.get<String>('/user/passkey/registration/options')
    }

    static verifyRegistration(params: PasskeyRegistrationReq) {
        return http.post<String>('/user/passkey/registration', params)
    }

    static getAssertionOptions() {
        return http.get<String>('/user/passkey/login/options')
    }

    static verifyAssertion(credential: string) {
        return http.post<UserLoginResp>('/user/passkey/login', credential)
    }

    // 获取用户的所有Passkey凭证
    static getPasskeys() {
        return http.get<PasskeyResp[]>('/user/passkeys')
    }

    // 更新Passkey描述
    static updatePasskeyDescription(data: ChangePasskeyReq) {
        return http.patch<string>(`/user/passkey/describe`, data)
    }

    // 删除Passkey凭证
    static deletePasskey(passkeyId: string) {
        return http.delete<string>(`/user/passkey/${passkeyId}`)
    }

    // 注册新的Passkey
    static registerPasskey(name: string, description?: string) {
        return http.post<PasskeyResp>('/user/passkey/register', { name, description })
    }
}

// 用户认证相关API
export class UserAPI {
    static doLogin(params: UserLoginReq) {
        return http.post<UserLoginResp>('/user/login', params)
    }

    static doRegister(params: UserRegister) {
        return http.post<UserLoginResp>('/user/register', params)
    }

    static info() {
        return http.get<UserInfo>('/user/info')
    }

    static async export() {
        try {
            // 设置文件名，包含当前日期
            const date = new Date().toISOString().split('T')[0]
            const filename = `bookmarks-export-${date}.json`

            // 使用专门的下载方法
            await http.download('/user/export', filename)

            return {success: true}
        } catch (error) {
            console.error('Export failed:', error)
            throw error
        }
    }

    static import(file: File) {
        return http.upload<any>('/user/import', file)
    }

    static clear() {
        return http.delete('/user/clear')
    }

    // 修改密码
    static changePassword(data: ChangePasswordReq) {
        return http.post<string>('/user/change-password', data)
    }

    // 获取密码状态
    static passwordState() {
        return http.get<boolean>('/user/password/status')
    }

    // 创建用户Key
    static createKey(data: CreateUserKeyReq) {
        return http.post<UserKeyResp>('/user/key', data)
    }

    // 获取用户的所有Key
    static getKeys() {
        return http.get<UserKeyResp[]>('/user/keys')
    }

    // 删除用户Key
    static deleteKey(keyId: string) {
        return http.delete<string>(`/user/key/${keyId}`)
    }

}

// 书签相关API
export class BookmarkAPI {

    static incrementUsage(bookmarkId: string) {
        return http.post(`/bookmark/${bookmarkId}/increment-usage`)
    }

    static noSpaceBookmark() {
        return http.get<BookmarkResp[]>('/bookmark/no-namespace')
    }

    // 获取最常使用的书签
    static getBookmarkById(id: string) {
        return http.get<BookmarkResp[]>(`/bookmark/${id}`)
    }

    // 获取最常使用的书签
    static getMostVisited(params: BookmarkQueryParams) {
        return http.get<BookmarkResp[]>('/bookmark/most-visited', {params})
    }

    // 搜索书签
    static search(params: { query: string; limit?: number }) {
        return http.get<BookmarkResp[]>('/bookmark/search', {params})
    }

    // 上传书签图标
    static uploadIcon(file: File) {
        const formData = new FormData()
        formData.append('file', file)
        return http.post<string>('/bookmark/upload/icon', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    // 新增书签
    static create(data: AddBookmarkReq) {
        return http.post<SnBookmark>('/bookmark', data)
    }

    // 编辑书签
    static update(data: EditBookmarkReq) {
        return http.put<SnBookmark>('/bookmark', data)
    }

    // 删除书签
    static delete(id: string) {
        return http.delete<string>('/bookmark', null, {params: {id}})
    }

    // 给书签加星标
    static addStar(id: string) {
        return http.post<string>('/bookmark/star', null, {params: {id}})
    }

    // 取消书签星标
    static removeStar(id: string) {
        return http.delete<string>('/bookmark/star', {params: {id}})
    }

    // 切换书签星标状态
    static toggleStar(id: string) {
        return http.put<string>('/bookmark/star', null, {params: {id}})
    }

    // 获取星标书签
    static getStarred(limit: number) {
        return http.get<BookmarkResp[]>('/bookmark/starred', {params: {limit}})
    }

    // 根据空间ID获取书签列表
    static getBySpaceId(spaceId: string, search?: string) {
        return http.get<BookmarkResp[]>(`/bookmark/space/${spaceId}`, {params: {search}})
    }

    // 获取空间的书签统计信息
    static getSpaceStats(spaceId: string) {
        return http.get<SpaceBookmarkStatsResp>(`/bookmark/space/${spaceId}/stats`)
    }

    // 根据标签ID获取关联的书签列表
    static getByTagId(tagId: string, search?: string) {
        return http.get<BookmarkResp[]>(`/bookmark/tag/${tagId}`, {params: {search}})
    }

    // 获取标签的书签统计信息
    static getTagStats(tagId: string) {
        return http.get<TagBookmarkStatsResp>(`/bookmark/tag/${tagId}/stats`)
    }

    // 导入Chrome书签
    static importChrome(file: File) {
        return http.upload<ImportBookmarkResp>('/bookmark/import/chrome', file)
    }
}

// 空间相关API
export class SpaceAPI {

    static dragSortSpaces(params: SpaceDragSortParams) {
        return http.put<String>('/space/drag-sort', params)
    }

    // 获取用户的所有空间
    static getAll(params?: SpaceQueryParams) {
        return http.get<Page<SpaceResp>>('/space', {params})
    }

    static getAllList() {
        return http.get<Page<SpaceRespSimple>>('/space/all')
    }

    // 新增空间
    static create(data: AddSpaceReq) {
        return http.post<SpaceResp>('/space', data)
    }

    // 编辑空间
    static update(data: EditSpaceReq) {
        return http.put<SpaceResp>('/space', data)
    }

    // 根据ID获取空间详情
    static getById(id: string) {
        return http.get<SpaceResp>(`/space/${id}`)
    }

    // 删除空间
    static delete(id: string) {
        return http.delete<string>(`/space/${id}`)
    }

    // 批量更新空间排序
    static updateSort(data: SortUpdateReq[]) {
        return http.put<string>('/space/sort', data)
    }
}

// 标签相关API
export class TagAPI {

    static dragSortTags(params: TagDragSortParams) {
        return http.put<String>('/tag/drag-sort', params)
    }

    //获取全部列表
    static getAllList() {
        return http.get<TagResp[]>('/tag/all')
    }

    // 获取用户的所有标签
    static getAll(params?: TagQueryParams) {
        return http.get<Page<TagResp>>('/tag', {params})
    }

    // 新增标签
    static create(data: AddTagReq) {
        return http.post<TagResp>('/tag', data)
    }

    // 编辑标签
    static update(data: EditTagReq) {
        return http.put<TagResp>('/tag', data)
    }

    // 根据ID获取标签详情
    static getById(id: string) {
        return http.get<TagResp>(`/tag/${id}`)
    }

    // 删除标签
    static delete(id: string) {
        return http.delete<string>(`/tag/${id}`)
    }

    // 获取用户标签统计信息
    static getStats() {
        return http.get<TagStatsResp>('/tag/stats')
    }
}

// 接收书签相关API
export class ReceivedBookmarkAPI {
    // 获取用户的接收书签列表
    static getAll(params?: ReceivedBookmarkQueryParams) {
        return http.get<Page<ReceivedBookmarkResp>>('/received/bookmark', {params})
    }

    // 新增接收书签
    static create(data: AddReceivedBookmarkReq) {
        return http.post<ReceivedBookmarkResp>('/received/bookmark', data)
    }

    // 编辑接收书签
    static update(data: EditReceivedBookmarkReq) {
        return http.put<ReceivedBookmarkResp>('/received/bookmark', data)
    }

    // 根据ID获取接收书签详情
    static getById(id: string) {
        return http.get<ReceivedBookmarkResp>(`/received/bookmark/${id}`)
    }

    // 删除接收书签（状态改为3）
    static delete(id: string) {
        return http.delete<string>(`/received/bookmark/${id}`)
    }

    // 确认接收书签并转为正式书签
    static confirm(id: string) {
        return http.post<string>(`/received/bookmark/${id}/confirm`)
    }

    // 获取接收书签统计信息
    static getStats() {
        return http.get<ReceivedBookmarkStatsResp>('/received/bookmark/stats')
    }
}

export class ShareAPI {
    static updateShare(data: UpdateShareBookmarkReq) {
        return http.patch<string>("/space-share/update", data)
    }

    static getShareUrl(data: GetShareUrl) {
        return http.get<string>(`/space-share/share-url`, {params: data})
    }

    static getCollectionsUsers(data: SearchCollectionUserReq) {
        return http.get<Page<CollectionUserInfoResp>>(`/space-share/collection-users`, {params: data})
    }

    static cancelCollectionUser(data: RemoveShareBookmarkReq) {
        return http.delete(`/space-share/remove`, data)
    }

    static collectionSpace(data: CollectionSpaceReq) {
        return http.post<string>('/space-share/collect', data)
    }

    static removeCollectionUser(params: { spaceId: string }) {
        return http.delete(`/space-share/cancel-collect`, null, {params: params})
    }

    // 获取用户的所有空间
    static getUserCollectionSpaces(params?: SpaceQueryParams) {
        return http.get<Page<SpaceResp>>('/space-share/user-spaces', {params})
    }

}

export class FaviconAPI {
    static getFavicon(domain: string, size: number = 32) {
        return `/api/favicon/icon?domain=${encodeURIComponent(domain)}&sz=${size}`
    }
}