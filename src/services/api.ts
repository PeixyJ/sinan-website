import {http} from '@/lib/http'
import type {
    SaTokenInfo,
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
    ReceivedBookmarkQueryParams, UserInfo, Page
} from '@/types/api'


// 用户认证相关API
export class UserAPI {
    static doLogin(credentials: { email: string; password: string }) {
        return http.post<SaTokenInfo>('/user/doLogin', credentials)
    }

    static info() {
        return http.get<UserInfo>('/user/info')
    }
}

// 书签相关API
export class BookmarkAPI {

    // 获取最常使用的书签
    static getBookmarkById(id: String) {
        return http.get<BookmarkResp[]>(`/bookmark/${id}`, {params: {id}})
    }

    // 获取最常使用的书签
    static getMostVisited(params: BookmarkQueryParams) {
        return http.get<BookmarkResp[]>('/bookmark/most-visited', {params})
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
        return http.delete<string>('/bookmark', {params: {id}})
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
}

// 空间相关API
export class SpaceAPI {
    // 获取用户的所有空间
    static getAll(params?: SpaceQueryParams) {
        return http.get<Page<SpaceResp>>('/space', {params})
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
        return http.get<ReceivedBookmarkResp[]>('/received/bookmark', {params})
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