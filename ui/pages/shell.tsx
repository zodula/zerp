interface ShellProps {
    children: React.ReactNode
}

export default function Shell(props: ShellProps) {
    return (
        <>
            {props.children}
        </>
    )
}