import { Menu, MenuItem } from '@mui/material'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import { GithubAuthProvider, User } from 'firebase/auth'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { toggleTheme } from '../../store/themeSlice'
import { githubProvider } from '.././Authentication/config/authMethod'
import Login from './MenuOptions/Login'
import Logout from './MenuOptions/Logout'
import ThemeOption from './MenuOptions/ThemeOption'
import UserInfo from './MenuOptions/UserInfo'

interface UserStatus {
    loggedIn: boolean
    info: User | null
}

type Props = {
    title: string
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onLogin: (provider: GithubAuthProvider) => Promise<string | void>
    onLogout: () => Promise<void>
    user: UserStatus
}

const MenuButton = ({ title, onUpload, onLogin, onLogout, user }: Props) => {
    const dispatch = useDispatch()

    const [anchor, setAnchor] = useState<(EventTarget & Element) | null>(null)
    //const [selected, setSelected] = useState(-1)

    const openMenu = (e: React.MouseEvent) => {
        setAnchor(e.currentTarget)
    }

    const closeMenu = () => {
        setAnchor(null)
    }

    const handleChangeTheme = () => {
        dispatch(toggleTheme())
        closeMenu()
    }

    const userPhoto = user.info === null ? '' : (user.info.photoURL as string)

    return (
        <Box>
            <Avatar
                src={userPhoto}
                sx={{
                    width: 35,
                    height: 35,
                    marginRight: 1,
                    marginTop: 1,
                    cursor: 'pointer',
                    border: '2px solid #1976d2',
                }}
                onClick={openMenu}
            />
            <Menu open={Boolean(anchor)} keepMounted anchorEl={anchor} onClose={closeMenu}>
                {user.loggedIn && <UserInfo user={user} />}
                <MenuItem onClick={() => (user.loggedIn ? onLogout() : onLogin(githubProvider))}>
                    {user.loggedIn ? <Logout /> : <Login />}
                </MenuItem>
                <MenuItem onClick={handleChangeTheme}>
                    <ThemeOption />
                </MenuItem>
            </Menu>
        </Box>
    )
}

export default MenuButton
