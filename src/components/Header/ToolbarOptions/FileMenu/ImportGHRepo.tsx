import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import GitHubIcon from '@mui/icons-material/GitHub'
import { ListItemText, MenuItem } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Popover from '@mui/material/Popover'
import TextField from '@mui/material/TextField'
import staticAxios from 'axios'
import { useEffect, useState } from 'react'
import { markdownToHtml } from '../../../../converterFunctions'
import { useAppSelector } from '../../../../store/hooks'

type Props = {
    setAnchor: React.Dispatch<React.SetStateAction<(EventTarget & Element) | null>>
    menuOpen: boolean
}

const ImportGHRepo = ({ setAnchor, menuOpen }: Props) => {
    const editor = useAppSelector((state) => state.editor.editor)
    const axios = useAppSelector((state) => state.auth.axios)
    const [showPopover, setShowPopover] = useState<boolean>(false)
    const [link, setLink] = useState<string>('')
    const [showError, setShowError] = useState<boolean>(false)
    const [showLoading, setShowLoading] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>('')

    const isValidLink = (url: string) => /(https?:\/\/)?(www\.)?github.com(\/[\w-]+){2}/.test(url)

    const getDefaultBranch = async (user: string, repo: string) => {
        interface GetRepoResponseDataType {
            default_branch: string
        }

        const { default_branch } = (
            await axios.get<GetRepoResponseDataType>(`https://api.github.com/repos/${user}/${repo}`)
        ).data
        return default_branch
    }

    const generateRawURL = async (url: string) => {
        let filePath = '/README.md'
        const [user, repo] = /github.com\/([\w-]+)\/([\w-]+)/.exec(url)?.slice(1) as [
            string,
            string
        ]
        let branch = /github.com(\/([\w-]+)){4}/.exec(url)?.[2]

        if (branch === undefined) branch = await getDefaultBranch(user, repo)
        else
            filePath =
                /github.com(\/[\w-]+){2}\/blob\/[\w-]+((\/[\w-]+)+.md)/.exec(url)?.[2] ?? filePath

        //to implement branch name input  (default as master)
        //corsproxy needs to be changed
        const rawLink = `https://thingproxy.freeboard.io/fetch/https://raw.githubusercontent.com/${user}/${repo}/${branch}${filePath}`
        console.log(rawLink)
        return rawLink
    }

    const openPopover = (e: React.MouseEvent) => {
        setShowPopover(true)
    }

    const closePopover = () => {
        setShowPopover(false)
        setShowError(false)
        setShowLoading(false)
        setAnchor(null)
    }

    const getRepo = async () => {
        setShowLoading(true)

        if (!isValidLink(link)) {
            setShowError(true)
            setErrorMessage('Invalid repo URL.')
            setShowLoading(false)
            return
        }

        try {
            type ResponseDataType = string
            let response = await axios.get<ResponseDataType>(await generateRawURL(link))
            setAnchor(null)
            editor.commands.setContent(markdownToHtml(response.data), true)
        } catch (e) {
            setShowError(true)
            if (!staticAxios.isAxiosError(e)) return setErrorMessage((e as Error).message)
            if (e.response?.status === 404)
                return setErrorMessage("Repo doesn't exists, or you don't have access to it.")
            return setErrorMessage(e.message)
        }
        setShowLoading(false)
    }

    useEffect(() => {
        if (!menuOpen) {
            setShowPopover(false)
        }
    }, [menuOpen])

    const linkInput = (
        <Box sx={{ padding: 1, paddingTop: 1.5, justifyContent: 'space-between', display: 'flex' }}>
            <Box>
                <TextField
                    error={showError}
                    type='text'
                    size='small'
                    sx={{ minWidth: 300 }}
                    label={'Repository Link'}
                    placeholder={'https://github.com/user/project'}
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => {
                        setLink(e.target.value)
                        setShowError(false)
                        setShowLoading(false)
                    }}
                    helperText={showError ? errorMessage : null}
                />
            </Box>
            <Box sx={{}}>
                {showLoading && !showError ? (
                    <Box sx={{ marginRight: 2.1, marginLeft: 0.5 }}>
                        <CircularProgress size={25} sx={{ marginTop: 0.8 }} />
                    </Box>
                ) : (
                    <Button sx={{ marginTop: 1, marginLeft: 0.9, pt: 3, pb: 3 }} onClick={getRepo}>
                        OK
                    </Button>
                )}
            </Box>
        </Box>
    )

    return (
        <MenuItem divider sx={{ paddingBottom: 1.3 }} onClick={openPopover}>
            <GitHubIcon sx={{ marginLeft: 0.5 }} />
            <ListItemText sx={{ marginLeft: 1.7 }}>Import from GitHub...</ListItemText>
            <ArrowForwardIosIcon
                sx={{ fontSize: 'small', marginLeft: 3 }}
                onMouseEnter={openPopover}
                id='popover'
            />
            <Popover
                sx={{ marginLeft: 3.8, marginTop: -1.8 }}
                open={showPopover}
                onClose={closePopover}
                anchorEl={document.getElementById('popover')}
                disableRestoreFocus
            >
                {linkInput}
            </Popover>
        </MenuItem>
    )
}

export default ImportGHRepo
